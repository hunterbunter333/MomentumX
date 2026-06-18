import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

console.log("🔥 SERVER STARTING...");

const app = express();

// Stripe webhooks need the raw body — must come BEFORE express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use(cors({
  origin: (origin, cb) => {
    // Allow localhost (dev) and any Vercel deployment
    if (!origin || /localhost/.test(origin) || /\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    // Also allow a custom FRONTEND_URL env var (set this in Railway to your Vercel URL)
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return cb(null, true);
    }
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// ── Clients ───────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role = full DB access (backend only)
);

// Stripe is optional — only initialize if key is present
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 60_000;

// How many active goals each plan allows
const TIER_LIMITS = {
  free: 1,
  pro: 20,
  growth: Infinity,
};

// ── Auth Middleware ───────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid or expired session" });

  req.user = user;
  req.token = token;
  next();
}

// ── AI — Groq (free cloud API, always running) ────────────────────────────────
//
// Groq is free, uses Llama 3.3 70B, and works for all users with no local setup.
// Get your free key at: https://console.groq.com (no credit card required)
// Add GROQ_API_KEY to server/.env

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL   = "llama-3.3-70b-versatile";

if (GROQ_API_KEY) {
  console.log("✅ AI provider: Groq (llama-3.3-70b-versatile) — free tier");
} else {
  console.log("⚠  GROQ_API_KEY not set — add it to server/.env");
  console.log("   Get a free key at: https://console.groq.com");
}

async function askAI(prompt, userPlan = "free", timeoutMs = TIMEOUT_MS) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured. Get a free key at console.groq.com and add it to server/.env");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Fetch a user's plan tier from DB (cached per request)
async function getUserPlan(userId) {
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).single();
  return data?.plan ?? "free";
}

function parseJSON(raw) {
  // Strip markdown code fences if Claude wrapped the JSON
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in AI response");
    return JSON.parse(match[0]);
  }
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── POST /clarify ─────────────────────────────────────────────────────────────
// Takes a goal → returns 5 personalized clarifying questions

app.post("/clarify", requireAuth, async (req, res) => {
  const { goal } = req.body;
  if (!goal?.trim()) return res.status(400).json({ error: "goal is required" });
  const userPlan = await getUserPlan(req.user.id);

  const prompt = `You are an elite business strategist and performance coach. A user has this goal: "${goal.trim()}"

Ask 5 smart, specific questions to understand their situation and build a high-impact plan.
Cover: (1) their current financial situation / starting capital, (2) their specific revenue target and deadline, (3) their current skills or experience relevant to this goal, (4) their biggest obstacle or fear, (5) what they have already tried or built so far.

Make questions direct and businesslike — not generic.

Respond with ONLY this JSON (no markdown, no explanation):
{"questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]}`;

  try {
    const raw = await askAI(prompt, userPlan);
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed.questions)) return res.status(502).json({ error: "AI returned invalid response" });
    return res.json({ questions: parsed.questions.slice(0, 5).map(String) });
  } catch (err) {
    if (err.name === "AbortError") return res.status(504).json({ error: "Ollama timed out — is it running?" });
    console.error("/clarify:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /generate ────────────────────────────────────────────────────────────
// Takes goal + answers → returns detailed plan with step-by-step instructions

app.post("/generate", requireAuth, async (req, res) => {
  const { goal, answers } = req.body;
  if (!goal?.trim()) return res.status(400).json({ error: "goal is required" });
  const userPlan = await getUserPlan(req.user.id);

  const context = Array.isArray(answers) && answers.length > 0
    ? answers
        .filter((a) => a.answer?.trim())
        .map((a) => `Q: ${a.question}\nA: ${a.answer.trim()}`)
        .join("\n\n")
    : "";

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const prompt = `You are a world-class business strategist and performance coach. Today is ${currentDate}.

Create a maximally specific, profit-focused action plan for this goal: "${goal.trim()}"
${context ? `\nUser's context:\n${context}` : ""}

CRITICAL requirements:
- Order steps by revenue impact — highest ROI actions first
- Every step MUST include exact tools, platforms, dollar amounts, or timeframes where applicable
- Each step "detail" must be 3-4 sentences: WHAT to do, exactly HOW to do it, expected outcome, and time required
- No generic advice — everything must be specific to this user's goal and situation
- Milestones must include timeframes AND measurable metrics (revenue, users, percentage, etc.)

Respond with ONLY this JSON (no markdown, no explanation):
{
  "goal": "Measurable, specific restatement of the goal with exact target and deadline",
  "steps": [
    {
      "title": "Action-verb title describing one concrete action",
      "detail": "Exactly how to execute this step. Name specific tools, platforms, strategies, and expected dollar outcomes. What does success look like for this step?"
    }
  ],
  "milestones": [
    "Week/Month X: [specific measurable result — e.g. '$2,000 in revenue' or '50 paying users']",
    "Month X: [specific measurable result]",
    "Final: [exact success metric matching the goal]"
  ]
}

Rules: 6-8 steps ordered by impact, exactly 3 milestones with timeframes and metrics, pure JSON only.`;

  try {
    const raw = await askAI(prompt, userPlan);
    const parsed = parseJSON(raw);

    if (!parsed.goal || !Array.isArray(parsed.steps) || !Array.isArray(parsed.milestones)) {
      return res.status(502).json({ error: "AI response missing required fields" });
    }

    const steps = parsed.steps.map((s) =>
      typeof s === "string"
        ? { title: s, detail: "" }
        : { title: String(s.title ?? ""), detail: String(s.detail ?? "") }
    );

    return res.json({
      goal: String(parsed.goal),
      steps,
      milestones: parsed.milestones.map(String),
    });
  } catch (err) {
    if (err.name === "AbortError") return res.status(504).json({ error: "Ollama timed out" });
    console.error("/generate:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /goals/save ──────────────────────────────────────────────────────────
// Saves a completed plan to the user's account (respects tier limits)

app.post("/goals/save", requireAuth, async (req, res) => {
  const { goal_text, plan } = req.body;
  if (!goal_text || !plan) return res.status(400).json({ error: "goal_text and plan are required" });

  // Get user's plan tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", req.user.id)
    .single();

  const userPlan = profile?.plan ?? "free";
  const limit = TIER_LIMITS[userPlan] ?? 1;

  // Count current active goals
  const { count } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", req.user.id)
    .eq("is_active", true);

  if (count >= limit) {
    return res.status(403).json({
      error: `Your ${userPlan} plan allows ${limit} active goal${limit === 1 ? "" : "s"}. Upgrade to save more.`,
      upgrade: true,
      plan: userPlan,
      limit,
    });
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: req.user.id, goal_text, plan })
    .select()
    .single();

  if (error) {
    console.error("Save goal:", error.message);
    return res.status(500).json({ error: "Failed to save goal" });
  }

  return res.json(data);
});

// ── GET /goals ────────────────────────────────────────────────────────────────
// Returns all active goals for the logged-in user, with today's advice joined

app.get("/goals", requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("goals")
    .select(`*, daily_advice(advice, advice_date)`)
    .eq("user_id", req.user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch goals" });
  return res.json(data ?? []);
});

// ── DELETE /goals/:id ─────────────────────────────────────────────────────────

app.delete("/goals/:id", requireAuth, async (req, res) => {
  const { error } = await supabase
    .from("goals")
    .update({ is_active: false })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id); // security: only delete own goals

  if (error) return res.status(500).json({ error: "Failed to delete goal" });
  return res.json({ success: true });
});

// ── GET /goals/:id/advice ─────────────────────────────────────────────────────
// Returns today's advice for a goal.
// If not generated yet today, generates it on-demand and caches in DB.

app.get("/goals/:id/advice", requireAuth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const forceRefresh = req.query.refresh === "true";

  // Check cache (skip if force-refresh requested)
  if (!forceRefresh) {
    const { data: existing } = await supabase
      .from("daily_advice")
      .select("advice")
      .eq("goal_id", req.params.id)
      .eq("user_id", req.user.id)
      .eq("advice_date", today)
      .single();

    if (existing) return res.json({ advice: existing.advice, fresh: false });
  }

  // Fetch the goal to build a context-aware prompt
  const { data: goal } = await supabase
    .from("goals")
    .select("goal_text, plan")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const userPlan  = await getUserPlan(req.user.id);
  const stepsText = goal.plan?.steps
    ?.map((s, i) => `${i + 1}. ${s.title}`)
    .join("\n") ?? "";

  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const fullDate  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const prompt = `You are an elite performance coach. Today is ${fullDate}.

The user is working on: "${goal.goal_text}"

Their action plan:
${stepsText}

Generate ONE hyper-specific coaching tip for TODAY (${dayOfWeek}). Requirements:
- Give ONE concrete action they can complete in the next 60-90 minutes RIGHT NOW
- Reference the day of the week if relevant (e.g. Monday = plan the week, Friday = review + prepare)
- Include a specific metric or outcome they should aim for today
- If this goal involves revenue/profit, mention a money-generating action specifically
- Be direct and commanding — not generic motivation

3-4 sentences. Reference their actual plan steps by name when helpful.

Respond with ONLY this JSON:
{"advice": "Your coaching tip here."}`;

  try {
    const raw = await askAI(prompt, userPlan, 45_000);
    const parsed = parseJSON(raw);
    const advice = String(parsed.advice ?? "").trim();

    if (!advice) return res.status(502).json({ error: "Could not generate advice" });

    // Cache it so we don't re-generate if they reload
    await supabase.from("daily_advice").upsert({
      goal_id: req.params.id,
      user_id: req.user.id,
      advice,
      advice_date: today,
    });

    return res.json({ advice, fresh: true });
  } catch (err) {
    console.error("/advice:", err.message);
    return res.status(502).json({ error: "Failed to generate advice" });
  }
});

// ── POST /goals/:id/chat ──────────────────────────────────────────────────────
// Answers any question the user has about their specific goal and plan

app.post("/goals/:id/chat", requireAuth, async (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: "question is required" });

  const { data: goal } = await supabase
    .from("goals")
    .select("goal_text, plan")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const userPlan  = await getUserPlan(req.user.id);
  const stepsText = goal.plan?.steps
    ?.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`)
    .join("\n") ?? "";

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const prompt = `You are an elite performance coach and business strategist. Today is ${currentDate}.

You are coaching someone working toward: "${goal.goal_text}"

Their action plan:
${stepsText}

The user asks: "${question.trim()}"

Give a direct, expert answer. Be specific — use real numbers, strategies, and examples when relevant.
If the question involves revenue or profit, give concrete dollar-focused advice.
If the question is about process, give exact next steps.
Reference their actual goal and plan where helpful.
4-6 sentences max. No fluff, no disclaimers.

Respond with ONLY this JSON:
{"answer": "Your expert answer here."}`;

  try {
    const raw = await askAI(prompt, userPlan, 60_000);
    const parsed = parseJSON(raw);
    const answer = String(parsed.answer ?? "").trim();
    if (!answer) return res.status(502).json({ error: "Could not generate answer" });
    return res.json({ answer });
  } catch (err) {
    if (err.name === "AbortError") return res.status(504).json({ error: "Ollama timed out — is it running?" });
    console.error("/chat:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /profile ──────────────────────────────────────────────────────────────

app.get("/profile", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: "Failed to fetch profile" });
  return res.json(data);
});

// ── POST /stripe/create-checkout ──────────────────────────────────────────────
// Creates a Stripe Checkout session and returns the URL to redirect to

app.post("/stripe/create-checkout", requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payments not configured yet." });

  const { plan } = req.body;

  const priceId =
    plan === "growth" ? process.env.STRIPE_GROWTH_PRICE_ID
    : plan === "pro"  ? process.env.STRIPE_PRO_PRICE_ID
    : null;

  if (!priceId) return res.status(400).json({ error: "Invalid plan" });

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", req.user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? req.user.email,
      metadata: { supabase_user_id: req.user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", req.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/dashboard?upgraded=true`,
    cancel_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/dashboard`,
    metadata: { user_id: req.user.id, plan },
  });

  return res.json({ url: session.url });
});

// ── POST /stripe/webhook ──────────────────────────────────────────────────────
// Stripe calls this when payments succeed/fail — updates the user's plan in DB

app.post("/stripe/webhook", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payments not configured yet." });

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Payment succeeded → upgrade the user
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { user_id, plan } = session.metadata ?? {};
    if (user_id && plan) {
      await supabase.from("profiles").update({ plan }).eq("id", user_id);
      console.log(`✅ Upgraded user ${user_id} to ${plan}`);
    }
  }

  // Subscription cancelled → downgrade back to free
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", sub.customer)
      .single();
    if (data) {
      await supabase.from("profiles").update({ plan: "free" }).eq("id", data.id);
      console.log(`⬇️ Downgraded user ${data.id} to free`);
    }
  }

  res.json({ received: true });
});

// ── Daily Advice Cron ─────────────────────────────────────────────────────────
// Runs at 6:00 AM every day.
// Pre-generates advice for all active goals so it's ready when users log in.

cron.schedule("0 6 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n🕐 [${today}] Running daily advice generation...`);

  // Find goals that don't have advice yet today
  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, user_id, goal_text, plan")
    .eq("is_active", true)
    .not(
      "id",
      "in",
      `(select goal_id from daily_advice where advice_date = '${today}')`
    );

  if (error) { console.error("Cron fetch error:", error.message); return; }
  if (!goals?.length) { console.log("All goals already have advice for today."); return; }

  console.log(`Generating advice for ${goals.length} goal(s)...`);

  for (const goal of goals) {
    try {
      const stepsText = goal.plan?.steps
        ?.map((s, i) => `${i + 1}. ${s.title}`)
        .join("\n") ?? "";

      const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const fullDate  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

      const prompt = `You are an elite performance coach. Today is ${fullDate}.

Goal: "${goal.goal_text}"
Plan steps:
${stepsText}

Give ONE specific coaching tip for today (${dayOfWeek}). Make it actionable in the next 60-90 minutes.
Reference the day of week, include a metric to aim for, and focus on revenue-generating actions if applicable.
3-4 sentences. Be direct and specific — not generic.

Respond with ONLY: {"advice": "Your coaching tip here."}`;

      const goalUserPlan = await getUserPlan(goal.user_id);
      const raw = await askAI(prompt, goalUserPlan, 30_000);
      const parsed = parseJSON(raw);
      const advice = String(parsed.advice ?? "").trim();
      if (!advice) continue;

      await supabase.from("daily_advice").upsert({
        goal_id: goal.id,
        user_id: goal.user_id,
        advice,
        advice_date: today,
      });

      console.log(`  ✓ Goal ${goal.id}`);
    } catch (err) {
      console.error(`  ✗ Goal ${goal.id}:`, err.message);
    }
  }

  console.log("✅ Daily advice generation complete.\n");
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
