import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  cyan:       "#00d4ff",
  cyanDim:    "rgba(0,212,255,0.09)",
  cyanBorder: "rgba(0,212,255,0.20)",
  cyanGlow:   "rgba(0,212,255,0.25)",
  bg:         "#040c18",
  bgCard:     "#070f1d",
  bgInput:    "#050c19",
  bgChat:     "#060e1b",
  text:       "#d4eaf6",
  textSub:    "#5a8aaa",
  textMuted:  "#2e4f68",
  textDim:    "#112030",
  orange:     "#ff6b35",
  orangeDim:  "rgba(255,107,53,0.09)",
  green:      "#00e87a",
  greenDim:   "rgba(0,232,122,0.09)",
  purple:     "#a855f7",
  purpleDim:  "rgba(168,85,247,0.09)",
  red:        "#ff4466",
  redDim:     "rgba(255,68,102,0.09)",
  gold:       "#ffcb47",
  goldDim:    "rgba(255,203,71,0.09)",
};

// ── Global Styles ─────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root {
        min-height: 100vh;
        background: ${C.bg};
        background-image:
          linear-gradient(rgba(0,212,255,0.016) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.016) 1px, transparent 1px);
        background-size: 52px 52px;
        color: ${C.text};
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        font-size: 15px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      input, textarea {
        color: ${C.text} !important;
        background: ${C.bgInput} !important;
        caret-color: ${C.cyan};
        font-size: 15px !important;
        font-family: inherit !important;
      }
      input::placeholder, textarea::placeholder { color: ${C.textMuted} !important; }
      input:focus, textarea:focus {
        outline: none !important;
        border-color: ${C.cyan} !important;
        box-shadow: 0 0 0 1px ${C.cyanBorder}, 0 0 12px ${C.cyanGlow} !important;
      }
      button { font-family: inherit; }
      @keyframes fade-up {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes logo-pulse {
        0%,100% { box-shadow: 0 0 5px ${C.green}, 0 0 10px ${C.green}55; }
        50%      { box-shadow: 0 0 9px ${C.green}, 0 0 20px ${C.green}66; }
      }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.cyanBorder}; border-radius: 2px; }
      .hud-btn { transition: filter 0.1s ease, transform 0.1s ease; }
      .hud-btn:hover:not(:disabled) { filter: brightness(1.18); transform: translateY(-1px); }
      .goal-card { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
      .goal-card:hover { border-color: rgba(0,212,255,0.42) !important; box-shadow: 0 4px 24px rgba(0,212,255,0.07) !important; }
      .tab-btn { transition: color 0.12s ease, border-color 0.12s ease, background 0.12s ease; }
      .step-row { transition: background 0.12s ease, border-color 0.12s ease; }
      .step-row:hover { background: rgba(0,212,255,0.035) !important; }
      .chat-msg { animation: fade-up 0.18s ease; }
      .suggest-btn { transition: color 0.12s ease, border-color 0.12s ease; }
      .suggest-btn:hover { color: ${C.text} !important; border-color: ${C.cyanBorder} !important; }
    `}</style>
  );
}

// ── Shared Components ─────────────────────────────────────────────────────────

function Panel({ children, style, accent = C.cyanBorder }) {
  const cs = { position: "absolute", width: 10, height: 10 };
  const corners = [
    { top: -1, left: -1, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderRadius: "4px 0 0 0" },
    { top: -1, right: -1, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderRadius: "0 4px 0 0" },
    { bottom: -1, left: -1, borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderRadius: "0 0 0 4px" },
    { bottom: -1, right: -1, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderRadius: "0 0 4px 0" },
  ];
  return (
    <div style={{ position: "relative", background: C.bgCard, border: `1px solid ${accent}`, borderRadius: 4, padding: "20px 22px", ...style }}>
      {corners.map((c, i) => <div key={i} style={{ ...cs, ...c }} />)}
      {children}
    </div>
  );
}

function SectionLabel({ emblem, children, color = C.cyan, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, ...style }}>
      {emblem && <span style={{ color, fontSize: 15 }}>{emblem}</span>}
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color, opacity: 0.9 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, transparent)` }} />
    </div>
  );
}

function Btn({ children, onClick, disabled, loading, variant = "primary", style, fullWidth, size = "md" }) {
  const pad  = { sm: "7px 14px", md: "10px 20px", lg: "13px 26px" };
  const fs   = { sm: 11, md: 12, lg: 13 };
  const map  = {
    primary: { bg: C.cyanDim,    border: C.cyan,    color: C.cyan    },
    orange:  { bg: C.orangeDim,  border: C.orange,  color: C.orange  },
    green:   { bg: C.greenDim,   border: C.green,   color: C.green   },
    purple:  { bg: C.purpleDim,  border: C.purple,  color: C.purple  },
    gold:    { bg: C.goldDim,    border: C.gold,    color: C.gold    },
    ghost:   { bg: "transparent",border: C.textMuted, color: C.textSub },
    danger:  { bg: C.redDim,     border: C.red,     color: C.red     },
  };
  const v = disabled || loading ? { bg: "transparent", border: C.textDim, color: C.textMuted } : (map[variant] || map.primary);
  return (
    <button className="hud-btn" onClick={onClick} disabled={disabled || loading} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
      padding: pad[size] || pad.md, fontSize: fs[size] || 12, fontWeight: 700,
      letterSpacing: "0.09em", textTransform: "uppercase", border: `1px solid ${v.border}`,
      borderRadius: 3, cursor: disabled || loading ? "not-allowed" : "pointer",
      background: v.bg, color: v.color, width: fullWidth ? "100%" : undefined,
      boxShadow: disabled || loading ? "none" : `0 0 7px ${v.border}33`,
      ...style,
    }}>
      {loading ? <><Spinner size={12} color={v.color} />&ensp;Working...</> : children}
    </button>
  );
}

function Spinner({ size = 16, color = C.cyan }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid rgba(0,212,255,0.12)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0,
    }} />
  );
}

function PlanBadge({ plan }) {
  const map = {
    free:   { label: "FREE",    color: C.textSub,  bg: "transparent" },
    pro:    { label: "PRO",     color: C.cyan,     bg: C.cyanDim     },
    growth: { label: "GROWTH",  color: C.purple,   bg: C.purpleDim   },
  };
  const p = map[plan] || map.free;
  return (
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: p.color, background: p.bg, border: `1px solid ${p.color}44`, padding: "2px 7px", borderRadius: 2 }}>
      {p.label}
    </span>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ marginTop: 14, padding: "12px 16px", background: C.redDim, border: `1px solid ${C.red}55`, borderRadius: 3, fontSize: 14, color: C.red, lineHeight: 1.6 }}>
      ⚠ {msg}
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession]           = useState(null);
  const [profile, setProfile]           = useState(null);
  const [page, setPage]                 = useState("dashboard");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goals, setGoals]               = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setGoals([]); setProfile(null); return; }
    fetchProfile();
    fetchGoals();
    const p = new URLSearchParams(window.location.search);
    if (p.get("upgraded") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(fetchProfile, 1500);
    }
  }, [session]);

  async function fetchProfile() {
    const { data } = await api("/profile", { token: session?.access_token });
    setProfile(data);
  }

  async function fetchGoals() {
    setGoalsLoading(true);
    const { ok, data } = await api("/goals", { token: session?.access_token });
    setGoals(ok && Array.isArray(data) ? data : []);
    setGoalsLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  function handleGoalSaved(savedGoal) {
    setGoals(p => [savedGoal, ...p]);
    setSelectedGoal(savedGoal);
    setPage("plan");
  }

  async function handleDeleteGoal(id) {
    await api(`/goals/${id}`, { method: "DELETE", token: session?.access_token });
    setGoals(p => p.filter(g => g.id !== id));
    if (selectedGoal?.id === id) setPage("dashboard");
  }

  if (!session) return <><GlobalStyles /><AuthPage /></>;

  return (
    <>
      <GlobalStyles />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px 72px", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <div style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 25, fontWeight: 900, letterSpacing: "-0.5px", color: C.cyan, textShadow: `0 0 22px ${C.cyanGlow}` }}>Momentum</span>
              <span style={{ fontSize: 25, fontWeight: 900, color: C.text }}>X</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "logo-pulse 3.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.14em", color: C.textMuted, textTransform: "uppercase" }}>Systems Online</span>
              {profile && <PlanBadge plan={profile.plan} />}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {profile?.plan === "free" && (
              <Btn onClick={() => setShowUpgrade(true)} variant="gold" size="sm">⬡ Upgrade</Btn>
            )}
            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>{session.user.email}</span>
            <Btn onClick={handleLogout} variant="ghost" size="sm">Exit</Btn>
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.cyan}, ${C.cyan}44, transparent)`, marginBottom: 26, boxShadow: `0 0 5px ${C.cyanGlow}` }} />

        {/* ── Pages ── */}
        {page === "dashboard" && (
          <Dashboard
            goals={goals} loading={goalsLoading} profile={profile}
            onNewGoal={() => setPage("create")}
            onSelectGoal={g => { setSelectedGoal(g); setPage("plan"); }}
            onDeleteGoal={handleDeleteGoal}
            onUpgrade={() => setShowUpgrade(true)}
          />
        )}
        {page === "create" && (
          <GoalWizard
            session={session} profile={profile} goals={goals}
            onSaved={handleGoalSaved}
            onBack={() => setPage("dashboard")}
            onUpgradeNeeded={() => setShowUpgrade(true)}
          />
        )}
        {page === "plan" && selectedGoal && (
          <PlanView
            goal={selectedGoal}
            session={session}
            onBack={() => setPage("dashboard")}
            onDelete={() => handleDeleteGoal(selectedGoal.id)}
          />
        )}

        {showUpgrade && (
          <UpgradeModal session={session} currentPlan={profile?.plan} onClose={() => setShowUpgrade(false)} />
        )}
      </div>
    </>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────────

function AuthPage() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message || "Incorrect email or password.");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message || "Signup failed. Please try again.");
      else if (data?.user?.identities?.length === 0)
        setError("An account with this email already exists. Try logging in.");
      else setMessage("Account created — you can now log in.");
    }
    setLoading(false);
  }

  const inp = {
    width: "100%", padding: "13px 16px", fontSize: 15,
    border: `1px solid ${C.cyanBorder}`, borderRadius: 3,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, animation: "fade-up 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-1px", marginBottom: 6 }}>
            <span style={{ color: C.cyan, textShadow: `0 0 32px ${C.cyanGlow}` }}>Momentum</span>
            <span style={{ color: C.text }}>X</span>
          </div>
          <div style={{ fontSize: 14, color: C.textSub, fontStyle: "italic", letterSpacing: "0.04em" }}>
            Become Who You're Meant to Be
          </div>
        </div>

        <Panel>
          <SectionLabel emblem="◈" children="Authentication" />
          <div style={{ display: "flex", gap: 2, marginBottom: 24, background: C.bgInput, borderRadius: 3, padding: 3 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setMessage(null); }}
                style={{
                  flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                  background: mode === m ? C.cyanDim : "transparent",
                  color: mode === m ? C.cyan : C.textMuted,
                  border: mode === m ? `1px solid ${C.cyanBorder}` : "1px solid transparent",
                  borderRadius: 2, boxShadow: mode === m ? `0 0 8px ${C.cyanGlow}` : "none",
                  transition: "all 0.18s",
                }}>
                {m === "login" ? "▶ Sign In" : "✦ Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSub, marginBottom: 7 }}>Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com" style={{ ...inp, marginBottom: 18 }} />

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textSub, marginBottom: 7 }}>Password</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••" style={{ ...inp, marginBottom: 24 }} />

            <Btn fullWidth loading={loading} size="lg">
              {mode === "login" ? "▶ Enter System" : "✦ Create Account"}
            </Btn>
          </form>

          <ErrorBox msg={error} />
          {message && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: C.greenDim, border: `1px solid ${C.green}55`, borderRadius: 3, fontSize: 14, color: C.green, lineHeight: 1.5 }}>
              ✓ {message}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ goals, loading, profile, onNewGoal, onSelectGoal, onDeleteGoal, onUpgrade }) {
  const isAtLimit = profile?.plan === "free" && goals.length >= 1;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 14, color: C.textSub, marginBottom: 6 }}>{greeting} · {dateStr}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Mission Control</div>
            <div style={{ fontSize: 15, color: C.textSub, marginTop: 3 }}>
              {goals.length === 0 ? "No active missions. Ready to deploy." : `${goals.length} active mission${goals.length !== 1 ? "s" : ""} in progress`}
            </div>
          </div>
          <Btn onClick={isAtLimit ? onUpgrade : onNewGoal} variant={isAtLimit ? "orange" : "primary"}>
            {isAtLimit ? "⬡ Upgrade to Add More" : "⊕ New Mission"}
          </Btn>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "56px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Spinner size={26} />
          <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textMuted }}>Loading missions...</span>
        </div>
      )}

      {!loading && goals.length === 0 && (
        <Panel style={{ textAlign: "center", padding: "56px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.35 }}>◎</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>No Active Missions</div>
          <div style={{ fontSize: 15, color: C.textSub, marginBottom: 28, lineHeight: 1.7, maxWidth: 380, margin: "0 auto 28px" }}>
            Define your goal and your AI coach will build a personalized, profit-maximizing action plan in minutes.
          </div>
          <Btn onClick={onNewGoal} size="lg">⊕ Launch First Mission</Btn>
        </Panel>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal}
            onClick={() => onSelectGoal(goal)}
            onDelete={() => onDeleteGoal(goal.id)} />
        ))}
      </div>

      {!loading && profile?.plan === "free" && goals.length >= 1 && (
        <div style={{ marginTop: 20, padding: "14px 20px", background: C.orangeDim, border: `1px solid ${C.orange}44`, borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 14, color: C.orange, lineHeight: 1.6 }}>
            <strong>Free plan:</strong> 1 mission limit reached. Upgrade to manage multiple goals and unlock unlimited AI coaching.
          </div>
          <Btn onClick={onUpgrade} variant="orange" size="sm" style={{ flexShrink: 0 }}>Upgrade →</Btn>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onClick, onDelete }) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysAdvice = goal.daily_advice?.find(a => a.advice_date === today)?.advice;
  const stepCount      = goal.plan?.steps?.length ?? 0;
  const milestoneCount = goal.plan?.milestones?.length ?? 0;

  return (
    <div className="goal-card" onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.cyanBorder}`, borderRadius: 4,
      padding: "18px 20px", cursor: "pointer", boxShadow: "0 2px 18px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.cyan, opacity: 0.7, marginBottom: 5 }}>
            ⚡ Active Mission
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, lineHeight: 1.4 }}>{goal.goal_text}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 4px", flexShrink: 0, transition: "color 0.12s" }}
          onMouseEnter={e => e.target.style.color = C.red}
          onMouseLeave={e => e.target.style.color = C.textDim}>
          ×
        </button>
      </div>

      {todaysAdvice && (
        <div style={{ fontSize: 15, color: C.green, background: C.greenDim, padding: "11px 15px", borderRadius: 3, borderLeft: `2px solid ${C.green}`, lineHeight: 1.65, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>⊙ Today's Coaching</span>
          {todaysAdvice}
        </div>
      )}

      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.textSub, fontFamily: "monospace" }}>⚡ {stepCount} steps</span>
        <span style={{ fontSize: 13, color: C.textSub, fontFamily: "monospace" }}>◆ {milestoneCount} milestones</span>
        <span style={{ fontSize: 13, color: C.textSub, fontFamily: "monospace" }}>{new Date(goal.created_at).toLocaleDateString()}</span>
        <span style={{ fontSize: 13, color: C.cyan, fontFamily: "monospace", marginLeft: "auto" }}>Open Plan →</span>
      </div>
    </div>
  );
}

// ── Goal Wizard ───────────────────────────────────────────────────────────────

function GoalWizard({ session, profile, goals, onSaved, onBack, onUpgradeNeeded }) {
  const [stage, setStage]     = useState("input");
  const [goal, setGoal]       = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const token = session?.access_token;

  const stages   = ["input", "questions", "plan"];
  const stageIdx = stages.indexOf(stage);

  async function fetchQuestions() {
    if (!goal.trim()) return;
    setLoading(true); setError(null);
    const { ok, data } = await api("/clarify", { method: "POST", body: { goal }, token });
    if (!ok) { setError(data.error || "Connection failed — is the server running?"); setLoading(false); return; }
    setQuestions(data.questions);
    setAnswers(new Array(data.questions.length).fill(""));
    setStage("questions");
    setLoading(false);
  }

  async function fetchPlan() {
    setLoading(true); setError(null);
    const { ok, data } = await api("/generate", {
      method: "POST",
      body: { goal, answers: questions.map((q, i) => ({ question: q, answer: answers[i] || "" })) },
      token,
    });
    if (!ok) { setError(data.error || "Plan generation failed."); setLoading(false); return; }
    setPlan(data); setStage("plan"); setLoading(false);
  }

  async function handleSave() {
    setSaving(true); setError(null);
    const { ok, data } = await api("/goals/save", { method: "POST", body: { goal_text: goal, plan }, token });
    if (!ok) {
      if (data.upgrade) { onUpgradeNeeded(); setSaving(false); return; }
      setError(data.error || "Failed to save."); setSaving(false); return;
    }
    onSaved(data);
  }

  const inp = {
    width: "100%", padding: "13px 16px", border: `1px solid ${C.cyanBorder}`,
    borderRadius: 3, lineHeight: 1.6, fontSize: 15,
  };

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={stage === "input" ? onBack : () => setStage(stages[stageIdx - 1])}
          style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 14, padding: 0 }}>
          ← {stage === "input" ? "Back" : "Previous"}
        </button>
        <div style={{ flex: 1, display: "flex", gap: 5 }}>
          {stages.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, transition: "all 0.3s", background: stageIdx >= i ? C.cyan : C.textDim, boxShadow: stageIdx >= i ? `0 0 5px ${C.cyanGlow}` : "none" }} />
          ))}
        </div>
        <span style={{ fontSize: 13, color: C.textSub }}>Step {stageIdx + 1} of 3</span>
      </div>

      {/* Stage 1 — Input */}
      {stage === "input" && (
        <Panel>
          <SectionLabel emblem="⚡" children="Mission Brief" />
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: C.text }}>What is your goal?</div>
          <div style={{ fontSize: 15, color: C.textSub, marginBottom: 20, lineHeight: 1.65 }}>
            Be specific — include a target outcome and timeframe. The AI will build a profit-maximizing plan tailored to you.
          </div>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.ctrlKey && !loading && fetchQuestions()}
            placeholder="e.g. Generate $10,000/month in recurring revenue from a SaaS business within 6 months"
            disabled={loading} rows={3}
            style={{ ...inp, resize: "vertical", minHeight: 90 }}
          />
          <div style={{ marginTop: 16 }}>
            <Btn onClick={fetchQuestions} loading={loading} disabled={loading || !goal.trim()} size="lg">
              Continue → Personalize Plan
            </Btn>
          </div>
          <ErrorBox msg={error} />
        </Panel>
      )}

      {/* Stage 2 — Questions */}
      {stage === "questions" && (
        <>
          <div style={{ padding: "13px 17px", background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 3, marginBottom: 16, fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
            ⚡ "{goal}"
          </div>
          <Panel>
            <SectionLabel emblem="◈" children="Personalization" />
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, color: C.text }}>Customize your plan</div>
            <div style={{ fontSize: 15, color: C.textSub, marginBottom: 22, lineHeight: 1.65 }}>
              Your answers allow the AI to give you specific, actionable steps — not generic advice. Skip anything you're unsure about.
            </div>
            {questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, border: `1px solid ${C.cyanBorder}`, borderRadius: 2, padding: "3px 8px", flexShrink: 0, fontFamily: "monospace" }}>Q{i + 1}</span>
                  <span style={{ fontSize: 15, color: C.text, lineHeight: 1.55 }}>{q}</span>
                </div>
                <textarea
                  value={answers[i] || ""}
                  onChange={e => setAnswers(p => { const n = [...p]; n[i] = e.target.value; return n; })}
                  placeholder="Your answer..."
                  rows={2}
                  style={{ ...inp, resize: "vertical", minHeight: 68 }}
                />
              </div>
            ))}
            <Btn onClick={fetchPlan} loading={loading} disabled={loading} size="lg">
              Generate My Action Plan →
            </Btn>
            <ErrorBox msg={error} />
          </Panel>
        </>
      )}

      {/* Stage 3 — Plan Preview */}
      {stage === "plan" && plan && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.green, textTransform: "uppercase" }}>◆ Plan Ready</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Review Your Action Plan</div>
            </div>
            <Btn onClick={handleSave} loading={saving} variant="green" size="lg">◆ Deploy Mission</Btn>
          </div>

          <div style={{ padding: "15px 18px", background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 3, marginBottom: 22, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.5 }}>
            {plan.goal}
          </div>

          <SectionLabel emblem="⚡" children={`Action Steps — ${plan.steps.length}`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {plan.steps.map((step, i) => (
              <Panel key={i} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.cyan, border: `1px solid ${C.cyanBorder}`, borderRadius: 2, padding: "3px 8px", flexShrink: 0, fontFamily: "monospace", minWidth: 34, textAlign: "center" }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.cyan, marginBottom: step.detail ? 7 : 0 }}>{step.title}</div>
                    {step.detail && <div style={{ fontSize: 15, color: C.text, lineHeight: 1.7 }}>{step.detail}</div>}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <SectionLabel emblem="◆" children={`Milestones — ${plan.milestones.length}`} color={C.green} />
          <Panel accent={`${C.green}44`}>
            {plan.milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < plan.milestones.length - 1 ? 14 : 0 }}>
                <span style={{ color: C.green, fontFamily: "monospace", fontSize: 14, flexShrink: 0, fontWeight: 800 }}>◆ {i + 1}</span>
                <span style={{ fontSize: 15, color: C.text, lineHeight: 1.65 }}>{m}</span>
              </div>
            ))}
          </Panel>
          <ErrorBox msg={error} />
        </>
      )}
    </div>
  );
}

// ── Plan View ─────────────────────────────────────────────────────────────────

function PlanView({ goal, session, onBack, onDelete }) {
  const [tab, setTab] = useState("plan");
  const [completedSteps, setCompletedSteps] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`mx_steps_${goal.id}`) || "[]"); }
    catch { return []; }
  });

  const plan       = goal.plan;
  const totalSteps = plan?.steps?.length ?? 0;
  const doneCount  = completedSteps.length;
  const progress   = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  function toggleStep(i) {
    setCompletedSteps(prev => {
      const next = prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i];
      localStorage.setItem(`mx_steps_${goal.id}`, JSON.stringify(next));
      return next;
    });
  }

  const TABS = [
    { id: "plan",  label: "⚡ Action Plan" },
    { id: "brief", label: "⊙ Daily Brief"  },
    { id: "chat",  label: "◈ Ask AI"       },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 14, padding: 0 }}>
          ← Mission Control
        </button>
        <Btn onClick={onDelete} variant="danger" size="sm">Archive</Btn>
      </div>

      {/* Mission Header */}
      <div style={{ padding: "18px 20px", background: C.bgCard, border: `1px solid ${C.orange}55`, borderRadius: 4, marginBottom: 16, boxShadow: `0 2px 14px ${C.orange}15` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: C.orange, textTransform: "uppercase", marginBottom: 7 }}>◉ Mission Active</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.4 }}>{goal.goal_text}</div>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 5, background: C.textDim, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: progress === 100 ? C.green : C.cyan,
              borderRadius: 3, transition: "width 0.35s ease",
              boxShadow: `0 0 5px ${progress === 100 ? C.green : C.cyan}`,
            }} />
          </div>
          <span style={{ fontSize: 14, color: progress === 100 ? C.green : C.cyan, fontFamily: "monospace", fontWeight: 700, flexShrink: 0, minWidth: 100, textAlign: "right" }}>
            {doneCount}/{totalSteps} · {progress}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 22, background: C.bgInput, borderRadius: 3, padding: 3 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn"
            style={{
              flex: 1, padding: "11px 0", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              background: tab === t.id ? C.cyanDim : "transparent",
              color: tab === t.id ? C.cyan : C.textSub,
              border: tab === t.id ? `1px solid ${C.cyanBorder}` : "1px solid transparent",
              borderRadius: 2, boxShadow: tab === t.id ? `0 0 7px ${C.cyanGlow}` : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan"  && <PlanTab plan={plan} completedSteps={completedSteps} toggleStep={toggleStep} />}
      {tab === "brief" && <BriefTab goal={goal} session={session} />}
      {tab === "chat"  && <GoalChat goal={goal} session={session} />}
    </div>
  );
}

// ── Plan Tab ──────────────────────────────────────────────────────────────────

function PlanTab({ plan, completedSteps, toggleStep }) {
  return (
    <div style={{ animation: "fade-up 0.2s ease" }}>
      <div style={{ fontSize: 13, color: C.textSub, marginBottom: 12 }}>Click a step to mark it complete.</div>

      <SectionLabel emblem="⚡" children={`Action Steps — ${plan?.steps?.length ?? 0}`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 30 }}>
        {plan?.steps?.map((step, i) => {
          const done = completedSteps.includes(i);
          return (
            <div key={i} className="step-row" onClick={() => toggleStep(i)}
              style={{
                background: C.bgCard,
                border: `1px solid ${done ? C.green + "55" : C.cyanBorder}`,
                borderRadius: 4, padding: "14px 18px", cursor: "pointer",
                opacity: done ? 0.72 : 1,
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 22, height: 22, border: `2px solid ${done ? C.green : C.cyanBorder}`,
                  borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? C.greenDim : "transparent", marginTop: 1, transition: "all 0.15s",
                }}>
                  {done && <span style={{ color: C.green, fontSize: 13, fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: done ? C.green : C.cyan, marginBottom: (step.detail && !done) ? 7 : 0, textDecoration: done ? "line-through" : "none" }}>
                    {i + 1}. {step.title}
                  </div>
                  {step.detail && !done && (
                    <div style={{ fontSize: 15, color: C.text, lineHeight: 1.72 }}>{step.detail}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SectionLabel emblem="◆" children={`Milestones — ${plan?.milestones?.length ?? 0}`} color={C.green} />
      <Panel accent={`${C.green}44`}>
        {plan?.milestones?.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < (plan?.milestones?.length ?? 0) - 1 ? 14 : 0 }}>
            <span style={{ color: C.green, fontFamily: "monospace", fontSize: 14, flexShrink: 0, fontWeight: 800 }}>◆ {i + 1}</span>
            <span style={{ fontSize: 15, color: C.text, lineHeight: 1.65 }}>{m}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ── Brief Tab ─────────────────────────────────────────────────────────────────

function BriefTab({ goal, session }) {
  const [advice, setAdvice]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => { loadAdvice(false); }, [goal.id]);

  async function loadAdvice(forceRefresh = false) {
    if (forceRefresh) setRefreshing(true); else setLoading(true);
    const url = `/goals/${goal.id}/advice${forceRefresh ? "?refresh=true" : ""}`;
    const { ok, data } = await api(url, { token: session?.access_token });
    if (ok) setAdvice(data.advice);
    setLoading(false);
    setRefreshing(false);
  }

  return (
    <div style={{ animation: "fade-up 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel emblem="⊙" children={`Today — ${today}`} color={C.green} style={{ marginBottom: 0, flex: 1 }} />
        <Btn onClick={() => loadAdvice(true)} loading={refreshing} variant="ghost" size="sm" style={{ marginLeft: 12 }}>↺ Refresh</Btn>
      </div>

      <Panel accent={`${C.green}44`} style={{ marginBottom: 18 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.textSub, fontSize: 15, padding: "6px 0" }}>
            <Spinner size={16} color={C.green} />
            Generating your personalized coaching tip for today...
          </div>
        ) : advice ? (
          <div style={{ fontSize: 16, color: C.text, lineHeight: 1.8 }}>{advice}</div>
        ) : (
          <div style={{ fontSize: 15, color: C.textSub, lineHeight: 1.65 }}>
            Could not generate advice. Make sure Ollama is running (<code style={{ color: C.cyan }}>ollama run llama3</code>), then click Refresh.
          </div>
        )}
      </Panel>

      <div style={{ padding: "14px 18px", background: C.bgCard, border: `1px solid ${C.cyanBorder}`, borderRadius: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.textSub, textTransform: "uppercase", marginBottom: 8 }}>⊙ About Daily Briefings</div>
        <div style={{ fontSize: 15, color: C.textSub, lineHeight: 1.7 }}>
          Your AI coach generates a fresh, personalized tip each day based on your goal and plan.
          Briefings are cached once generated — click Refresh to force a new one anytime.
        </div>
      </div>
    </div>
  );
}

// ── Goal Chat ─────────────────────────────────────────────────────────────────

function GoalChat({ goal, session }) {
  const [messages, setMessages] = useState([{
    role: "ai",
    text: "I'm your AI performance coach. Ask me anything — how to maximize profits, what to prioritize, how to overcome obstacles, or what to focus on right now.",
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text: q }]);
    setLoading(true);

    const { ok, data } = await api(`/goals/${goal.id}/chat`, {
      method: "POST", body: { question: q }, token: session?.access_token,
    });

    setMessages(p => [...p, {
      role: "ai",
      text: ok ? data.answer : "Could not get a response. Make sure Ollama is running.",
    }]);
    setLoading(false);
  }

  const suggestions = [
    "How do I generate revenue fastest?",
    "What should I focus on today?",
    "What's my biggest risk right now?",
    "Give me a 30-day sprint plan.",
    "How do I get my first paying customer?",
  ];

  return (
    <div style={{ animation: "fade-up 0.2s ease" }}>
      <SectionLabel emblem="◈" children="Ask Your AI Coach" />

      {/* Messages */}
      <div style={{
        background: C.bgChat, border: `1px solid ${C.cyanBorder}`, borderRadius: 4,
        padding: "16px", minHeight: 300, maxHeight: 440, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 14, marginBottom: 12,
      }}>
        {messages.map((m, i) => (
          <div key={i} className="chat-msg" style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "86%", padding: "12px 16px", borderRadius: 4, fontSize: 15, lineHeight: 1.7,
              background: m.role === "user" ? C.cyanDim : C.bgCard,
              border: `1px solid ${m.role === "user" ? C.cyanBorder : C.textDim}`,
              color: m.role === "user" ? C.cyan : C.text,
              borderBottomRightRadius: m.role === "user" ? 1 : 4,
              borderBottomLeftRadius:  m.role === "ai"   ? 1 : 4,
            }}>
              {m.role === "ai" && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: C.textSub, textTransform: "uppercase", marginBottom: 7 }}>◈ AI COACH</div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg" style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ padding: "12px 16px", borderRadius: 4, background: C.bgCard, border: `1px solid ${C.textDim}`, display: "flex", alignItems: "center", gap: 10, color: C.textSub, fontSize: 15 }}>
              <Spinner size={14} /> Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick suggestions (first load only) */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} className="suggest-btn"
              style={{
                padding: "7px 13px", fontSize: 13, color: C.textSub, background: "transparent",
                border: `1px solid ${C.textDim}`, borderRadius: 3, cursor: "pointer",
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about your goal..."
          disabled={loading}
          style={{ flex: 1, padding: "12px 16px", border: `1px solid ${C.cyanBorder}`, borderRadius: 3 }}
        />
        <Btn onClick={send} disabled={!input.trim() || loading} loading={loading}>Send ⚡</Btn>
      </div>
    </div>
  );
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ session, currentPlan, onClose }) {
  const [loading, setLoading] = useState(null);

  async function handleUpgrade(plan) {
    setLoading(plan);
    const { ok, data } = await api("/stripe/create-checkout", { method: "POST", body: { plan }, token: session?.access_token });
    if (ok && data.url) window.location.href = data.url;
    else { alert("Payments not configured yet."); setLoading(null); }
  }

  const plans = [
    {
      id: "pro", label: "PRO", price: "$12/mo", color: "primary", accent: C.cyan,
      features: ["20 active missions", "Daily AI coaching", "Detailed step-by-step plans", "AI goal chat"],
    },
    {
      id: "growth", label: "GROWTH", price: "$29/mo", color: "purple", accent: C.purple,
      features: ["Unlimited missions", "Everything in Pro", "Priority AI responses", "Advanced analytics"],
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,12,24,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 520, animation: "fade-up 0.3s ease" }}>
        <Panel>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 22 }}>×</button>
          <SectionLabel emblem="⬡" children="Upgrade Plan" color={C.gold} />
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>Maximize Your Results</div>
          <div style={{ fontSize: 15, color: C.textSub, marginBottom: 24, lineHeight: 1.65 }}>
            Unlock more missions, unlimited AI coaching, and advanced performance tools.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ border: `1px solid ${plan.accent}44`, borderRadius: 4, padding: "18px 20px", background: `${plan.accent}08`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", color: plan.accent, marginBottom: 9 }}>{plan.label} — {plan.price}</div>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: 15, color: C.textSub, lineHeight: 2 }}>▸ {f}</div>
                  ))}
                </div>
                <Btn onClick={() => handleUpgrade(plan.id)} loading={loading === plan.id}
                  disabled={currentPlan === plan.id} variant={plan.color} style={{ flexShrink: 0, marginTop: 2 }}>
                  {currentPlan === plan.id ? "Active" : "Select"}
                </Btn>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 20, letterSpacing: "0.04em" }}>
            Secured by Stripe · Cancel anytime
          </div>
        </Panel>
      </div>
    </div>
  );
}
