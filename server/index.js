import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

console.log("🔥 SERVER STARTING...");

const app = express();

// ── Rate Limiter (in-memory, no external package needed) ───────────────────────
// Tracks hits per IP per window. Automatically clears old buckets every 5 min.

const _rateBuckets = new Map();
setInterval(() => {
  const cutoff = Date.now();
  for (const [key, bucket] of _rateBuckets) {
    if (bucket.resetAt < cutoff) _rateBuckets.delete(key);
  }
}, 5 * 60 * 1000);

function rateLimit({ windowMs, max, message = "Too many requests — please slow down." }) {
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const bucket = _rateBuckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      _rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count++;
    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Rate limit presets
const aiLimit    = rateLimit({ windowMs: 60_000, max: 10, message: "Too many AI requests — wait a moment and try again." });
const globalLimit = rateLimit({ windowMs: 60_000, max: 60 });

// Stripe webhooks need the raw body — must come BEFORE express.json()
app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use(cors({
  origin: (origin, cb) => {
    // Allow localhost (dev)
    if (!origin || /localhost/.test(origin)) return cb(null, true);
    // Allow the explicitly configured production frontend URL
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "64kb" })); // cap request body size
app.use(globalLimit); // apply global rate limit to every route

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

// Fetch recent journal entries to give the AI memory of what the user has been doing
async function getUserJournalContext(userId) {
  const { data } = await supabase
    .from("journal_entries")
    .select("entry_date, note, ai_suggestion")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(5);

  if (!data?.length) return "";

  const entries = data
    .map(e => {
      const d = new Date(e.entry_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return `[${d}]: "${e.note}"`;
    })
    .join("\n");

  return `\nUser's recent progress journal (last ${data.length} entries):\n${entries}\n`;
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

// ── POST /admin/set-plan ──────────────────────────────────────────────────────
// Tester-only: instantly switch your own plan. Locked to ADMIN_EMAIL env var.

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "huntercmathiesen@gmail.com";

app.post("/admin/set-plan", requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { plan } = req.body;
  if (!["free", "pro", "growth"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Must be free, pro, or growth." });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", req.user.id);

  if (error) {
    console.error("Admin set-plan error:", error.message);
    return res.status(500).json({ error: "Failed to update plan" });
  }

  console.log(`🧪 [ADMIN] ${req.user.email} switched to ${plan}`);
  return res.json({ success: true, plan });
});

// ── POST /clarify ─────────────────────────────────────────────────────────────
// Takes a goal → returns 5 personalized clarifying questions

app.post("/clarify", requireAuth, aiLimit, async (req, res) => {
  const { goal } = req.body;
  if (!goal?.trim()) return res.status(400).json({ error: "goal is required" });
  if (goal.length > 500) return res.status(400).json({ error: "Goal must be 500 characters or fewer." });
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
    if (err.name === "AbortError") return res.status(504).json({ error: "AI service timed out — please try again." });
    console.error("/clarify:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /generate ────────────────────────────────────────────────────────────
// Takes goal + answers → returns detailed plan with step-by-step instructions

app.post("/generate", requireAuth, aiLimit, async (req, res) => {
  const { goal, answers } = req.body;
  if (!goal?.trim()) return res.status(400).json({ error: "goal is required" });
  if (goal.length > 500) return res.status(400).json({ error: "Goal must be 500 characters or fewer." });
  const userPlan = await getUserPlan(req.user.id);

  // Fetch onboarding profile for personalization
  const { data: profileData } = await supabase
    .from("profiles")
    .select("onboarding_goal_type, onboarding_daily_time, onboarding_challenge, onboarding_motivation")
    .eq("id", req.user.id)
    .single();

  const onboardingContext = profileData && (profileData.onboarding_goal_type || profileData.onboarding_challenge)
    ? `\nUser profile: Goal type: ${profileData.onboarding_goal_type || "not specified"}. Daily time available: ${profileData.onboarding_daily_time || "not specified"}. Biggest challenge: ${profileData.onboarding_challenge || "not specified"}. Motivation: ${profileData.onboarding_motivation || "not specified"}.`
    : "";

  const context = Array.isArray(answers) && answers.length > 0
    ? answers
        .slice(0, 5) // max 5 answers
        .filter((a) => a.answer?.trim())
        .map((a) => `Q: ${String(a.question ?? "").slice(0, 200)}\nA: ${String(a.answer).trim().slice(0, 500)}`)
        .join("\n\n")
    : "";

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const prompt = `You are a world-class business strategist and performance coach. Today is ${currentDate}.

Create a maximally specific, profit-focused action plan for this goal: "${goal.trim()}"
${onboardingContext}${context ? `\nUser's Q&A context:\n${context}` : ""}

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
    if (err.name === "AbortError") return res.status(504).json({ error: "AI service timed out — please try again." });
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

app.get("/goals/:id/advice", requireAuth, aiLimit, async (req, res) => {
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

  const [userPlan, journalContext] = await Promise.all([
    getUserPlan(req.user.id),
    getUserJournalContext(req.user.id),
  ]);
  const stepsText = goal.plan?.steps
    ?.map((s, i) => `${i + 1}. ${s.title}`)
    .join("\n") ?? "";

  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const fullDate  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const prompt = `You are an elite performance coach. Today is ${fullDate}.

The user is working on: "${goal.goal_text}"

Their action plan:
${stepsText}
${journalContext}
Generate ONE hyper-specific coaching tip for TODAY (${dayOfWeek}). Requirements:
- If they have recent journal entries, reference what they've been working on and build directly on it
- Give ONE concrete action they can complete in the next 60-90 minutes RIGHT NOW
- Reference the day of the week if relevant (e.g. Monday = plan the week, Friday = review + prepare)
- Include a specific metric or outcome they should aim for today
- If this goal involves revenue/profit, mention a money-generating action specifically
- Be direct and commanding — not generic motivation

3-4 sentences. Reference their actual progress and plan steps by name when helpful.

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

app.post("/goals/:id/chat", requireAuth, aiLimit, async (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: "question is required" });
  if (question.length > 500) return res.status(400).json({ error: "Question must be 500 characters or fewer." });

  const { data: goal } = await supabase
    .from("goals")
    .select("goal_text, plan")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const [userPlan, journalContext] = await Promise.all([
    getUserPlan(req.user.id),
    getUserJournalContext(req.user.id),
  ]);
  const stepsText = goal.plan?.steps
    ?.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`)
    .join("\n") ?? "";

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const prompt = `You are an elite performance coach and business strategist. Today is ${currentDate}.

You are coaching someone working toward: "${goal.goal_text}"

Their action plan:
${stepsText}
${journalContext}
The user asks: "${question.trim()}"

Give a direct, expert answer that references their actual recent progress where relevant. Be specific — use real numbers, strategies, and examples when relevant.
If the question involves revenue or profit, give concrete dollar-focused advice.
If the question is about process, give exact next steps grounded in what they've already done.
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
    if (err.name === "AbortError") return res.status(504).json({ error: "AI service timed out — please try again." });
    console.error("/chat:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /checkin ─────────────────────────────────────────────────────────────
// Called once per day on login. Updates streak, returns full streak data.

app.post("/checkin", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_checkin_date, total_logins, plan")
    .eq("id", userId)
    .single();

  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const last = profile.last_checkin_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak = profile.current_streak ?? 0;

  if (last === today) {
    // Already checked in today — just return current data
    return res.json({
      current_streak: newStreak,
      longest_streak: profile.longest_streak ?? 0,
      total_logins: profile.total_logins ?? 0,
      last_checkin_date: last,
      already_checked_in: true,
    });
  }

  if (last === yesterday) {
    newStreak = newStreak + 1; // Continuing streak
  } else {
    newStreak = 1; // Streak broken (or first login)
  }

  const newLongest = Math.max(newStreak, profile.longest_streak ?? 0);
  const newTotal = (profile.total_logins ?? 0) + 1;

  // Record this checkin date in the checkin_log table
  await supabase.from("checkin_log").upsert({
    user_id: userId,
    checkin_date: today,
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_checkin_date: today,
      total_logins: newTotal,
    })
    .eq("id", userId);

  if (error) {
    console.error("Checkin error:", error.message);
    return res.status(500).json({ error: "Failed to record checkin" });
  }

  return res.json({
    current_streak: newStreak,
    longest_streak: newLongest,
    total_logins: newTotal,
    last_checkin_date: today,
    already_checked_in: false,
  });
});

// ── GET /journal ──────────────────────────────────────────────────────────────
// Returns journal entries for the last 30 days for the logged-in user

app.get("/journal", requireAuth, async (req, res) => {
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("journal_entries")
    .select("entry_date, note, ai_suggestion")
    .eq("user_id", req.user.id)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch journal" });
  return res.json(data ?? []);
});

// ── POST /journal/:date ───────────────────────────────────────────────────────
// Saves a journal note for a date. Generates an AI coaching tip from the note + goals.

app.post("/journal/:date", requireAuth, aiLimit, async (req, res) => {
  const { date } = req.params;
  const { note } = req.body;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
  }
  if (!note?.trim()) return res.status(400).json({ error: "note is required" });
  if (note.length > 1000) return res.status(400).json({ error: "Note must be 1000 characters or fewer." });

  const userId = req.user.id;
  const userPlan = await getUserPlan(userId);

  // Fetch user's active goals for context
  const { data: goals } = await supabase
    .from("goals")
    .select("goal_text, plan")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(3);

  const goalContext = (goals ?? [])
    .map(g => `- ${g.goal_text}`)
    .join("\n");

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const prompt = `You are an expert performance coach. Today is ${today}.

A user is tracking their progress toward these goals:
${goalContext || "- (no goals set yet)"}

They just logged this progress note: "${note.trim()}"

Based on what they shared, give ONE specific, actionable coaching tip for what they should do NEXT — today or tomorrow. Make it concrete and directly tied to their note and goals. 2-3 sentences max. No generic motivation. No fluff.

Respond with ONLY this JSON:
{"suggestion": "Your coaching tip here."}`;

  try {
    const raw = await askAI(prompt, userPlan, 20_000);
    const parsed = parseJSON(raw);
    const ai_suggestion = String(parsed.suggestion ?? "").trim();

    // Upsert: create or update the entry for this date
    const { data, error } = await supabase
      .from("journal_entries")
      .upsert({
        user_id: userId,
        entry_date: date,
        note: note.trim(),
        ai_suggestion: ai_suggestion || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,entry_date" })
      .select("entry_date, note, ai_suggestion")
      .single();

    if (error) {
      console.error("Journal upsert error:", error.message);
      return res.status(500).json({ error: "Failed to save journal entry" });
    }

    return res.json(data);
  } catch (err) {
    console.error("/journal/:date:", err.message);
    // Save without AI suggestion if AI fails
    const { data } = await supabase
      .from("journal_entries")
      .upsert({
        user_id: userId,
        entry_date: date,
        note: note.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,entry_date" })
      .select("entry_date, note, ai_suggestion")
      .single();
    return res.json(data ?? { entry_date: date, note: note.trim(), ai_suggestion: null });
  }
});

// ── GET /checkin/history ──────────────────────────────────────────────────────
// Returns checkin dates for the last 30 days (Pro+) or 7 days (free)

app.get("/checkin/history", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const days = (profile?.plan === "pro" || profile?.plan === "growth") ? 30 : 7;
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("checkin_log")
    .select("checkin_date")
    .eq("user_id", userId)
    .gte("checkin_date", since)
    .order("checkin_date", { ascending: true });

  if (error) return res.status(500).json({ error: "Failed to fetch history" });

  return res.json({
    dates: (data ?? []).map(r => r.checkin_date),
    days,
    plan: profile?.plan ?? "free",
  });
});

// ── GET /motivation ───────────────────────────────────────────────────────────
// Returns today's motivational message (AI-generated, cached daily per user)

app.get("/motivation", requireAuth, aiLimit, async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Check cache
  const { data: cached } = await supabase
    .from("daily_motivation")
    .select("message")
    .eq("user_id", userId)
    .eq("motivation_date", today)
    .single();

  if (cached) return res.json({ message: cached.message, fresh: false });

  // Fetch profile for personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_goal_type, onboarding_motivation, current_streak, plan")
    .eq("id", userId)
    .single();

  const goalType = profile?.onboarding_goal_type || "their goals";
  const motivation = profile?.onboarding_motivation || "personal growth";
  const streak = profile?.current_streak || 0;
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const userPlan = profile?.plan ?? "free";

  const journalContext = await getUserJournalContext(userId);
  const streakLine = streak > 1 ? ` They're on a ${streak}-day streak.` : "";

  const prompt = `You are a high-performance coach writing a short daily message for someone working on: "${goalType}". Their core motivation is: "${motivation}".${streakLine} Today is ${dayOfWeek}.
${journalContext}
Write ONE punchy, direct message. If they have recent journal entries, acknowledge what they've been working on specifically — this shows you're paying attention. Otherwise be motivating and personal to their goal type. 1-2 sentences max. No emojis. No hashtags. Be the coach who tells the truth.

Respond with ONLY this JSON:
{"message": "Your message here."}`;

  try {
    const raw = await askAI(prompt, userPlan, 20_000);
    const parsed = parseJSON(raw);
    const message = String(parsed.message ?? "").trim();
    if (!message) return res.status(502).json({ error: "Could not generate message" });

    // Cache it
    await supabase.from("daily_motivation").upsert({
      user_id: userId,
      message,
      motivation_date: today,
    });

    return res.json({ message, fresh: true });
  } catch (err) {
    console.error("/motivation:", err.message);
    // Return a fallback so the UI doesn't break
    return res.json({ message: "Show up today. That's the whole plan.", fresh: false });
  }
});

// ── GET /profile ──────────────────────────────────────────────────────────────

app.get("/profile", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, plan, current_streak, longest_streak, total_logins, last_checkin_date, onboarding_done, onboarding_goal_type, onboarding_daily_time, onboarding_challenge, onboarding_motivation, display_name")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: "Failed to fetch profile" });
  return res.json(data);
});

// ── PATCH /profile/onboarding ─────────────────────────────────────────────────
// Saves onboarding quiz answers to the profile

app.patch("/profile/onboarding", requireAuth, async (req, res) => {
  const { goal_type, daily_time, biggest_challenge, motivation, display_name } = req.body;

  const updateFields = {
    onboarding_done: true,
    onboarding_goal_type: goal_type ?? null,
    onboarding_daily_time: daily_time ?? null,
    onboarding_challenge: biggest_challenge ?? null,
    onboarding_motivation: motivation ?? null,
  };

  // Only set display_name if provided and non-empty
  if (display_name?.trim()) updateFields.display_name = display_name.trim().slice(0, 50);

  const { error } = await supabase
    .from("profiles")
    .update(updateFields)
    .eq("id", req.user.id);

  if (error) {
    console.error("Onboarding save:", error.message);
    return res.status(500).json({ error: "Failed to save onboarding" });
  }
  return res.json({ success: true });
});

// ── PATCH /profile/display-name ──────────────────────────────────────────────
// Updates the user's display name (shown in greeting instead of email)

app.patch("/profile/display-name", requireAuth, async (req, res) => {
  const { display_name } = req.body;
  if (!display_name?.trim()) return res.status(400).json({ error: "display_name is required" });
  const trimmed = display_name.trim().slice(0, 50);

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", req.user.id);

  if (error) {
    console.error("Display name update:", error.message);
    return res.status(500).json({ error: "Failed to update display name" });
  }
  return res.json({ success: true, display_name: trimmed });
});

// ── DELETE /account ───────────────────────────────────────────────────────────

app.delete("/account", requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    // Delete all user data in dependency order (most specific → least specific)
    await supabase.from("daily_advice").delete().eq("user_id", userId);
    await supabase.from("daily_motivation").delete().eq("user_id", userId);
    await supabase.from("checkin_log").delete().eq("user_id", userId);
    await supabase.from("journal_entries").delete().eq("user_id", userId);
    await supabase.from("goals").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    return res.json({ success: true });
  } catch (e) {
    console.error("Delete account error:", e);
    return res.status(500).json({ error: "Failed to delete account" });
  }
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

// ── Email Helper (Resend) ─────────────────────────────────────────────────────
// Set RESEND_API_KEY in Railway env vars. Get a free key at resend.com.
// If not set, nudges are silently skipped — no errors thrown.

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "no key" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MomentumX <noreply@momentumxapp.com>",
        to,
        subject,
        html,
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ── Streak Nudge Cron ─────────────────────────────────────────────────────────
// Runs at 9:00 PM every day.
// Sends a nudge email to users whose streak is at risk (haven't checked in today
// but have a current streak > 0). Keeps streaks alive, drives re-engagement.

cron.schedule("0 21 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  console.log(`\n🔔 [${today}] Running streak nudge emails...`);

  if (!process.env.RESEND_API_KEY) {
    console.log("   ⚠  RESEND_API_KEY not set — skipping nudge emails.");
    return;
  }

  // Find users who:
  // - Last checked in yesterday (streak is intact but today not done yet)
  // - Have a current streak > 0
  const { data: atRisk, error } = await supabase
    .from("profiles")
    .select("id, email, current_streak, onboarding_goal_type")
    .eq("last_checkin_date", yesterday)
    .gt("current_streak", 0);

  if (error) { console.error("Nudge fetch error:", error.message); return; }
  if (!atRisk?.length) { console.log("   No at-risk streaks today."); return; }

  console.log(`   Sending nudges to ${atRisk.length} user(s)...`);

  const appUrl = process.env.FRONTEND_URL ?? "https://momentumxapp.com";

  for (const user of atRisk) {
    const streak = user.current_streak;
    const goalLabel = user.onboarding_goal_type === "income" ? "your income goal"
      : user.onboarding_goal_type === "health" ? "your health goal"
      : user.onboarding_goal_type === "skills" ? "your skill-building goal"
      : user.onboarding_goal_type === "personal" ? "your personal development goal"
      : "your goal";

    const subject = streak >= 7
      ? `⚡ Don't lose your ${streak}-day streak`
      : `🔥 Your ${streak}-day streak is on the line`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080d1a;font-family:'Inter',system-ui,sans-serif;color:#ddeeff;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:36px;">
      <div style="width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,#00d4ff,#0090b8);display:inline-flex;align-items:center;justify-content:center;">
        <span style="font-size:11px;color:#07111f;font-weight:900;">MX</span>
      </div>
      <span style="font-size:17px;font-weight:800;background:linear-gradient(135deg,#00d4ff,#7ee8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">MomentumX</span>
    </div>

    <!-- Streak badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;padding:12px 24px;background:rgba(255,201,71,0.1);border:1px solid rgba(255,201,71,0.3);border-radius:20px;">
        <span style="font-size:28px;">🔥</span>
        <span style="font-size:22px;font-weight:900;color:#ffc947;margin-left:8px;">${streak}-day streak</span>
      </div>
    </div>

    <!-- Headline -->
    <h1 style="font-size:26px;font-weight:900;color:#ddeeff;line-height:1.2;margin:0 0 14px;letter-spacing:-0.5px;">
      Check in before midnight to keep it going.
    </h1>

    <!-- Body -->
    <p style="font-size:15px;color:#5e8eaa;line-height:1.8;margin:0 0 28px;">
      You've been consistent for <strong style="color:#ffc947;">${streak} days</strong> on ${goalLabel}.
      That's real momentum — don't let tonight break the chain.
      One check-in. Two minutes. Keep the streak alive.
    </p>

    <!-- CTA -->
    <a href="${appUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00d4ff,#00b5d8);color:#07111f;font-weight:800;font-size:15px;text-decoration:none;border-radius:10px;box-shadow:0 0 24px rgba(0,212,255,0.3);">
      Check In Now →
    </a>

    <!-- Footer -->
    <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="font-size:12px;color:#2a4460;margin:0;">
        You're receiving this because you have an active streak on MomentumX.<br>
        <a href="${appUrl}/profile" style="color:#2a4460;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const result = await sendEmail({ to: user.email, subject, html });
    console.log(`   ${result.ok ? "✓" : "✗"} ${user.email} (${streak}-day streak)`);
  }

  console.log("✅ Streak nudge emails complete.\n");
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
