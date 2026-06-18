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

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  cyan:         "#00d4ff",
  bg:           "#080d1a",
  bgCard:       "#0d1626",
  bgInput:      "#0f1d30",
  bgHover:      "#122338",
  bgOverlay:    "rgba(8,13,26,0.94)",
  text:         "#ddeeff",
  textSub:      "#5e8eaa",
  textMuted:    "#2a4460",
  textDim:      "#152030",
  green:        "#00e87a",
  orange:       "#ff8c42",
  purple:       "#a855f7",
  red:          "#ff4466",
  gold:         "#ffc947",
  cyanDim:      "rgba(0,212,255,0.07)",
  cyanBorder:   "rgba(0,212,255,0.15)",
  cyanGlow:     "rgba(0,212,255,0.18)",
  greenDim:     "rgba(0,232,122,0.07)",
  greenBorder:  "rgba(0,232,122,0.22)",
  orangeDim:    "rgba(255,140,66,0.08)",
  orangeBorder: "rgba(255,140,66,0.25)",
  purpleDim:    "rgba(168,85,247,0.07)",
  purpleBorder: "rgba(168,85,247,0.25)",
  redDim:       "rgba(255,68,102,0.08)",
  redBorder:    "rgba(255,68,102,0.25)",
  goldDim:      "rgba(255,201,71,0.08)",
  goldBorder:   "rgba(255,201,71,0.25)",
};

// ── Global Styles ──────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      html, body, #root {
        min-height: 100vh;
        background: ${C.bg};
        background-image: radial-gradient(ellipse 90% 55% at 50% -10%, rgba(0,212,255,0.055) 0%, transparent 65%);
        color: ${C.text};
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
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
        box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important;
      }

      button { font-family: inherit; }

      @keyframes fade-up {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse-dot {
        0%,100% { opacity: 1; box-shadow: 0 0 4px ${C.green}; }
        50%      { opacity: 0.5; box-shadow: 0 0 8px ${C.green}; }
      }

      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.cyanBorder}; border-radius: 2px; }

      .card-hover { transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease; }
      .card-hover:hover { border-color: rgba(0,212,255,0.3) !important; box-shadow: 0 6px 32px rgba(0,0,0,0.5) !important; transform: translateY(-1px); }
      .btn { transition: opacity 0.15s ease, transform 0.12s ease; }
      .btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .btn:active:not(:disabled) { transform: translateY(0); }
      .tab { transition: color 0.15s, background 0.15s, box-shadow 0.15s; }
      .step-row { transition: background 0.12s ease; }
      .step-row:hover { background: rgba(0,212,255,0.03) !important; }
      .chat-msg { animation: fade-up 0.18s ease; }
      .chip { transition: color 0.12s, border-color 0.12s, background 0.12s; }
      .chip:hover { color: ${C.text} !important; border-color: rgba(0,212,255,0.3) !important; background: rgba(0,212,255,0.05) !important; }
    `}</style>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function Card({ children, style, accent, hoverable }) {
  return (
    <div
      className={hoverable ? "card-hover" : undefined}
      style={{
        background: C.bgCard,
        border: `1px solid ${accent || C.cyanBorder}`,
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 20px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Label ──────────────────────────────────────────────────────────────────────
function Label({ children, color = C.textSub, icon, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, ...style }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.11em",
        textTransform: "uppercase", color, opacity: 0.9,
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}30, transparent)` }} />
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, loading, variant = "primary", style, fullWidth, size = "md" }) {
  const sizes = {
    sm: { padding: "7px 14px",  fontSize: 12 },
    md: { padding: "10px 20px", fontSize: 13 },
    lg: { padding: "13px 26px", fontSize: 14 },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary:   { bg: C.cyan,       color: "#07111f", border: C.cyan,         shadow: "0 0 20px rgba(0,212,255,0.22)" },
    secondary: { bg: C.cyanDim,    color: C.cyan,    border: C.cyanBorder,   shadow: "0 0 10px rgba(0,212,255,0.08)" },
    green:     { bg: C.greenDim,   color: C.green,   border: C.greenBorder,  shadow: "0 0 10px rgba(0,232,122,0.08)" },
    orange:    { bg: C.orangeDim,  color: C.orange,  border: C.orangeBorder, shadow: "0 0 10px rgba(255,140,66,0.08)" },
    purple:    { bg: C.purpleDim,  color: C.purple,  border: C.purpleBorder, shadow: "0 0 10px rgba(168,85,247,0.08)" },
    gold:      { bg: C.goldDim,    color: C.gold,    border: C.goldBorder,   shadow: "0 0 10px rgba(255,201,71,0.08)" },
    ghost:     { bg: "transparent",color: C.textSub, border: C.textMuted,    shadow: "none" },
    danger:    { bg: C.redDim,     color: C.red,     border: C.redBorder,    shadow: "0 0 10px rgba(255,68,102,0.08)" },
  };

  const v = (disabled || loading)
    ? { bg: "transparent", color: C.textMuted, border: C.textDim, shadow: "none" }
    : (variants[variant] || variants.primary);

  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: s.padding, fontSize: s.fontSize, fontWeight: 700, letterSpacing: "0.02em",
        border: `1px solid ${v.border}`, borderRadius: 8,
        background: v.bg, color: v.color, boxShadow: v.shadow,
        width: fullWidth ? "100%" : undefined,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {loading ? <><Spinner size={12} color={v.color} /> Working...</> : children}
    </button>
  );
}

function Spinner({ size = 16, color = C.cyan }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2px solid rgba(0,212,255,0.1)",
      borderTopColor: color, borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      display: "inline-block", flexShrink: 0,
    }} />
  );
}

function PlanBadge({ plan }) {
  const map = {
    free:   { label: "Free",   color: C.textSub, bg: "transparent",  border: C.textMuted    },
    pro:    { label: "Pro",    color: C.cyan,    bg: C.cyanDim,      border: C.cyanBorder   },
    growth: { label: "Growth", color: C.purple,  bg: C.purpleDim,    border: C.purpleBorder },
  };
  const p = map[plan] || map.free;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      color: p.color, background: p.bg, border: `1px solid ${p.border}`,
      padding: "2px 9px", borderRadius: 20,
    }}>
      {p.label}
    </span>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      marginTop: 16, padding: "13px 16px",
      background: C.redDim, border: `1px solid ${C.redBorder}`,
      borderRadius: 8, fontSize: 14, color: C.red, lineHeight: 1.6,
    }}>
      {msg}
    </div>
  );
}

// ── App Root ───────────────────────────────────────────────────────────────────
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
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", color: C.cyan }}>Momentum</span>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", color: C.text }}>X</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse-dot 2.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.05em" }}>AI Coach Active</span>
              {profile && <PlanBadge plan={profile.plan} />}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {profile?.plan === "free" && (
              <Btn onClick={() => setShowUpgrade(true)} variant="gold" size="sm">✦ Upgrade</Btn>
            )}
            <button
              onClick={() => setPage("profile")}
              title={session.user.email}
              className="btn"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
                color: C.cyan, fontSize: 13, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {session.user.email?.[0]?.toUpperCase() || "U"}
            </button>
          </div>
        </header>

        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.cyanBorder}, rgba(0,212,255,0.05), transparent)`, marginBottom: 32 }} />

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
        {page === "profile" && (
          <ProfilePage
            session={session}
            profile={profile}
            onBack={() => setPage("dashboard")}
            onLogout={handleLogout}
            onNavigate={setPage}
          />
        )}
        {page === "privacy" && <PrivacyPage onBack={() => setPage("profile")} />}
        {page === "terms"   && <TermsPage   onBack={() => setPage("profile")} />}

        {showUpgrade && (
          <UpgradeModal session={session} currentPlan={profile?.plan} onClose={() => setShowUpgrade(false)} />
        )}
      </div>
    </>
  );
}

// ── Auth Page ──────────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);

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
      else setMessage("Account created — check your email to confirm, then sign in.");
    }
    setLoading(false);
  }

  const inp = {
    width: "100%", padding: "13px 16px",
    border: `1px solid ${C.cyanBorder}`, borderRadius: 8, lineHeight: 1.5,
  };

  const benefits = [
    { icon: "🎯", text: "AI builds a personalized action plan for your specific goal" },
    { icon: "📅", text: "Daily coaching tips so you always know what to do next" },
    { icon: "📈", text: "Track your progress and build momentum every day" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 440, animation: "fade-up 0.4s ease" }}>

        {/* Logo & tagline */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 12 }}>
            <span style={{ color: C.cyan }}>Momentum</span>
            <span style={{ color: C.text }}>X</span>
          </div>
          <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.5, marginBottom: 28 }}>
            Your AI-powered coach for reaching goals faster.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, textAlign: "left", maxWidth: 310, margin: "0 auto" }}>
            {benefits.map(b => (
              <div key={b.text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                <span style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <Card>
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.bgInput, borderRadius: 8, padding: 4 }}>
            {["login", "signup"].map(m => (
              <button key={m} className="tab"
                onClick={() => { setMode(m); setError(null); setMessage(null); }}
                style={{
                  flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", borderRadius: 6, border: "none",
                  background: mode === m ? C.cyanDim : "transparent",
                  color: mode === m ? C.cyan : C.textSub,
                  boxShadow: mode === m ? `0 0 0 1px ${C.cyanBorder}` : "none",
                }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 7 }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 7 }}>Password</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" style={inp} />
            </div>
            <Btn fullWidth loading={loading} size="lg" style={{ marginTop: 4 }}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Btn>
          </form>

          <ErrorBox msg={error} />
          {message && (
            <div style={{ marginTop: 16, padding: "13px 16px", background: C.greenDim, border: `1px solid ${C.greenBorder}`, borderRadius: 8, fontSize: 14, color: C.green, lineHeight: 1.55 }}>
              {message}
            </div>
          )}
        </Card>

        <p style={{ textAlign: "center", fontSize: 12, color: C.textMuted, marginTop: 20 }}>
          No credit card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ goals, loading, profile, onNewGoal, onSelectGoal, onDeleteGoal, onUpgrade }) {
  const isAtLimit = profile?.plan === "free" && goals.length >= 1;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Avg progress across goals
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => {
        try {
          const saved = JSON.parse(localStorage.getItem(`mx_steps_${g.id}`) || "[]");
          const total = g.plan?.steps?.length ?? 0;
          return sum + (total > 0 ? Math.round((saved.length / total) * 100) : 0);
        } catch { return sum; }
      }, 0) / goals.length)
    : 0;

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* Greeting row */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: C.textSub, marginBottom: 6 }}>{greeting} · {dateStr}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>Your Dashboard</h1>
            <p style={{ fontSize: 15, color: C.textSub, marginTop: 4 }}>
              {goals.length === 0
                ? "Ready to start? Set your first goal below."
                : `${goals.length} active goal${goals.length !== 1 ? "s" : ""}. Keep the momentum going.`}
            </p>
          </div>
          <Btn onClick={isAtLimit ? onUpgrade : onNewGoal} variant={isAtLimit ? "orange" : "primary"}>
            {isAtLimit ? "Upgrade to Add More" : "+ New Goal"}
          </Btn>
        </div>
      </div>

      {/* Stats strip */}
      {goals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Active Goals",  value: goals.length,      color: C.cyan,   icon: "🎯" },
            { label: "Avg. Progress", value: `${avgProgress}%`, color: C.green,  icon: "📈" },
            { label: "Login Streak",  value: "—",               color: C.gold,   icon: "🔥", sub: "Coming soon" },
          ].map(s => (
            <Card key={s.label} style={{ padding: "18px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {s.sub || s.label}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Spinner size={24} />
          <span style={{ fontSize: 14, color: C.textMuted }}>Loading your goals...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <Card style={{ textAlign: "center", padding: "64px 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 18, opacity: 0.25 }}>🎯</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10 }}>No goals yet</h2>
          <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.75, maxWidth: 360, margin: "0 auto 28px" }}>
            Tell the AI your goal and it will build a personalized action plan with daily coaching tips — in under a minute.
          </p>
          <Btn onClick={onNewGoal} size="lg">Start Your First Goal →</Btn>
        </Card>
      )}

      {/* Goal list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal}
            onClick={() => onSelectGoal(goal)}
            onDelete={() => onDeleteGoal(goal.id)} />
        ))}
      </div>

      {/* Free plan nudge */}
      {!loading && profile?.plan === "free" && goals.length >= 1 && (
        <div style={{ marginTop: 20, padding: "16px 20px", background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 3 }}>Free plan — 1 goal limit</div>
            <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.55 }}>
              Upgrade to manage multiple goals and unlock unlimited AI coaching.
            </div>
          </div>
          <Btn onClick={onUpgrade} variant="orange" size="sm" style={{ flexShrink: 0 }}>Upgrade →</Btn>
        </div>
      )}
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, onClick, onDelete }) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysAdvice = goal.daily_advice?.find(a => a.advice_date === today)?.advice;

  let progress = 0, doneCount = 0;
  const totalSteps = goal.plan?.steps?.length ?? 0;
  try {
    const saved = JSON.parse(localStorage.getItem(`mx_steps_${goal.id}`) || "[]");
    doneCount = saved.length;
    progress  = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  } catch {}

  return (
    <div className="card-hover" onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.cyanBorder}`,
      borderRadius: 12, padding: "22px 24px", cursor: "pointer",
      boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.cyan, opacity: 0.7, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>
            Active Goal
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, lineHeight: 1.45 }}>{goal.goal_text}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, lineHeight: 1, padding: "2px 5px", flexShrink: 0, borderRadius: 4, transition: "color 0.12s", cursor: "pointer" }}
          onMouseEnter={e => e.target.style.color = C.red}
          onMouseLeave={e => e.target.style.color = C.textMuted}>
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: todaysAdvice ? 16 : 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: C.textSub }}>{doneCount}/{totalSteps} steps complete</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: progress === 100 ? C.green : C.cyan }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: C.textDim, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: progress === 100 ? C.green : `linear-gradient(90deg, #00b0d8, ${C.cyan})`,
            borderRadius: 4, transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Today's coaching */}
      {todaysAdvice && (
        <div style={{
          fontSize: 14, color: C.text, lineHeight: 1.7,
          background: "rgba(0,232,122,0.05)",
          padding: "12px 16px", borderRadius: 8,
          borderLeft: `3px solid ${C.green}`,
          marginTop: 4,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
            Today's Coaching
          </span>
          {todaysAdvice}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <span style={{ fontSize: 13, color: C.cyan, fontWeight: 600 }}>View Plan →</span>
      </div>
    </div>
  );
}

// ── Goal Wizard ────────────────────────────────────────────────────────────────
function GoalWizard({ session, profile, goals, onSaved, onBack, onUpgradeNeeded }) {
  const [stage, setStage]         = useState("input");
  const [goal, setGoal]           = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState([]);
  const [plan, setPlan]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const token = session?.access_token;

  const stages      = ["input", "questions", "plan"];
  const stageIdx    = stages.indexOf(stage);
  const stageLabels = ["Define Goal", "Personalize", "Review Plan"];

  async function fetchQuestions() {
    if (!goal.trim()) return;
    setLoading(true); setError(null);
    const { ok, data } = await api("/clarify", { method: "POST", body: { goal }, token });
    if (!ok) { setError(data.error || "Connection failed. Please try again."); setLoading(false); return; }
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
    width: "100%", padding: "13px 16px",
    border: `1px solid ${C.cyanBorder}`, borderRadius: 8, lineHeight: 1.6,
  };

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <button onClick={stage === "input" ? onBack : () => setStage(stages[stageIdx - 1])}
          style={{ background: "none", border: "none", color: C.cyan, fontSize: 14, fontWeight: 600, padding: 0, cursor: "pointer", flexShrink: 0 }}>
          ← {stage === "input" ? "Back" : "Previous"}
        </button>
        <div style={{ flex: 1, display: "flex", gap: 5 }}>
          {stages.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                height: 3, width: "100%", borderRadius: 2,
                background: stageIdx >= i ? C.cyan : C.textDim,
                transition: "background 0.3s", boxShadow: stageIdx >= i ? `0 0 6px ${C.cyanGlow}` : "none",
              }} />
              <span style={{ fontSize: 10, color: stageIdx >= i ? C.textSub : C.textMuted, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {stageLabels[i]}
              </span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>{stageIdx + 1} / 3</span>
      </div>

      {/* Stage 1 — Input */}
      {stage === "input" && (
        <Card>
          <Label icon="🎯">Your Goal</Label>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10 }}>What do you want to achieve?</h2>
          <p style={{ fontSize: 15, color: C.textSub, marginBottom: 22, lineHeight: 1.75 }}>
            Be specific — include a target outcome and a timeframe. The more detail you give, the better your plan will be.
          </p>
          <textarea
            value={goal} onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.ctrlKey && !loading && fetchQuestions()}
            placeholder="e.g. Generate $5,000/month in freelance income within 3 months by offering web development services"
            disabled={loading} rows={4}
            style={{ ...inp, resize: "vertical", minHeight: 100 }}
          />
          <div style={{ marginTop: 20 }}>
            <Btn onClick={fetchQuestions} loading={loading} disabled={loading || !goal.trim()} size="lg">
              Continue → Personalize Plan
            </Btn>
          </div>
          <ErrorBox msg={error} />
        </Card>
      )}

      {/* Stage 2 — Questions */}
      {stage === "questions" && (
        <>
          <div style={{ padding: "14px 18px", background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 10, marginBottom: 20, fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>
            "{goal}"
          </div>
          <Card>
            <Label icon="✏️">Personalize Your Plan</Label>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>A few quick questions</h2>
            <p style={{ fontSize: 15, color: C.textSub, marginBottom: 26, lineHeight: 1.7 }}>
              Your answers help the AI give you specific, actionable steps — not generic advice. Skip anything you're unsure about.
            </p>
            {questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 6, padding: "3px 10px", flexShrink: 0 }}>
                    Q{i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>{q}</span>
                </div>
                <textarea
                  value={answers[i] || ""}
                  onChange={e => setAnswers(p => { const n = [...p]; n[i] = e.target.value; return n; })}
                  placeholder="Your answer (optional)..."
                  rows={2}
                  style={{ ...inp, resize: "vertical", minHeight: 72 }}
                />
              </div>
            ))}
            <Btn onClick={fetchPlan} loading={loading} disabled={loading} size="lg">
              Generate My Plan →
            </Btn>
            <ErrorBox msg={error} />
          </Card>
        </>
      )}

      {/* Stage 3 — Plan Preview */}
      {stage === "plan" && plan && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Plan Ready</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Review Your Action Plan</h2>
            </div>
            <Btn onClick={handleSave} loading={saving} variant="green" size="lg">Save & Start →</Btn>
          </div>

          <div style={{ padding: "16px 20px", background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 10, marginBottom: 26, fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.55 }}>
            {plan.goal}
          </div>

          <Label icon="⚡">{`Action Steps — ${plan.steps.length}`}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {plan.steps.map((step, i) => (
              <Card key={i} style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBorder}`, borderRadius: 6, padding: "3px 10px", flexShrink: 0, minWidth: 36, textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: step.detail ? 8 : 0 }}>{step.title}</div>
                    {step.detail && <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.8 }}>{step.detail}</div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Label icon="◆" color={C.green}>{`Milestones — ${plan.milestones.length}`}</Label>
          <Card style={{ borderColor: C.greenBorder }}>
            {plan.milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < plan.milestones.length - 1 ? 18 : 0 }}>
                <span style={{ color: C.green, fontSize: 16, flexShrink: 0, marginTop: 2 }}>◆</span>
                <span style={{ fontSize: 15, color: C.text, lineHeight: 1.7 }}>{m}</span>
              </div>
            ))}
          </Card>
          <ErrorBox msg={error} />
        </>
      )}
    </div>
  );
}

// ── Plan View ──────────────────────────────────────────────────────────────────
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
    { id: "plan",  label: "Action Plan" },
    { id: "brief", label: "Daily Brief" },
    { id: "chat",  label: "Ask AI"      },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: C.cyan, fontSize: 14, fontWeight: 600, padding: 0, cursor: "pointer" }}>
          ← Dashboard
        </button>
        <Btn onClick={onDelete} variant="ghost" size="sm">Remove Goal</Btn>
      </div>

      {/* Goal header */}
      <Card style={{ marginBottom: 20, borderColor: "rgba(255,140,66,0.2)", background: "rgba(255,140,66,0.025)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 9 }}>
          Active Goal
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.45, marginBottom: 18 }}>
          {goal.goal_text}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 6, background: C.textDim, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: progress === 100 ? C.green : `linear-gradient(90deg, #00b0d8, ${C.cyan})`,
              borderRadius: 4, transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: progress === 100 ? C.green : C.cyan, flexShrink: 0 }}>
            {doneCount}/{totalSteps} · {progress}%
          </span>
        </div>
      </Card>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 26, background: C.bgInput, borderRadius: 10, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="tab"
            style={{
              flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 700,
              cursor: "pointer", borderRadius: 7, border: "none",
              background: tab === t.id ? C.cyanDim : "transparent",
              color: tab === t.id ? C.cyan : C.textSub,
              boxShadow: tab === t.id ? `0 0 0 1px ${C.cyanBorder}` : "none",
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

// ── Plan Tab ───────────────────────────────────────────────────────────────────
function PlanTab({ plan, completedSteps, toggleStep }) {
  return (
    <div style={{ animation: "fade-up 0.2s ease" }}>
      <p style={{ fontSize: 14, color: C.textSub, marginBottom: 18 }}>Click any step to mark it complete.</p>

      <Label icon="⚡">{`Action Steps — ${plan?.steps?.length ?? 0}`}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {plan?.steps?.map((step, i) => {
          const done = completedSteps.includes(i);
          return (
            <div key={i} className="step-row" onClick={() => toggleStep(i)}
              style={{
                background: C.bgCard,
                border: `1px solid ${done ? C.greenBorder : C.cyanBorder}`,
                borderRadius: 10, padding: "16px 20px", cursor: "pointer",
                opacity: done ? 0.65 : 1,
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${done ? C.green : C.cyanBorder}`,
                  background: done ? C.greenDim : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {done && <span style={{ color: C.green, fontSize: 12, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 15, lineHeight: 1.4,
                    color: done ? C.green : C.text,
                    textDecoration: done ? "line-through" : "none",
                    marginBottom: (step.detail && !done) ? 8 : 0,
                  }}>
                    {i + 1}. {step.title}
                  </div>
                  {step.detail && !done && (
                    <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.8 }}>{step.detail}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Label icon="◆" color={C.green}>{`Milestones — ${plan?.milestones?.length ?? 0}`}</Label>
      <Card style={{ borderColor: C.greenBorder }}>
        {plan?.milestones?.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < (plan?.milestones?.length ?? 0) - 1 ? 18 : 0 }}>
            <span style={{ color: C.green, fontSize: 16, flexShrink: 0, marginTop: 2 }}>◆</span>
            <span style={{ fontSize: 15, color: C.text, lineHeight: 1.75 }}>{m}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Brief Tab ──────────────────────────────────────────────────────────────────
function BriefTab({ goal, session }) {
  const [advice, setAdvice]         = useState(null);
  const [loading, setLoading]       = useState(true);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Label icon="📅" color={C.green} style={{ marginBottom: 0, flex: 1 }}>{`Today — ${today}`}</Label>
        <Btn onClick={() => loadAdvice(true)} loading={refreshing} variant="ghost" size="sm" style={{ marginLeft: 12 }}>↺ Refresh</Btn>
      </div>

      <Card style={{ borderColor: C.greenBorder, marginBottom: 16 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.textSub, padding: "4px 0" }}>
            <Spinner size={16} color={C.green} />
            <span>Generating your daily coaching tip...</span>
          </div>
        ) : advice ? (
          <div style={{ fontSize: 16, color: C.text, lineHeight: 1.85 }}>{advice}</div>
        ) : (
          <div style={{ fontSize: 15, color: C.textSub, lineHeight: 1.65 }}>
            Could not generate a coaching tip. Click Refresh to try again.
          </div>
        )}
      </Card>

      <Card style={{ borderColor: C.textDim }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          About Daily Briefings
        </div>
        <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.8 }}>
          Your AI coach generates a fresh, personalized tip each day based on your goal and action plan.
          Briefings are automatically prepared at 6 AM every morning. Click Refresh to get a new one anytime.
        </p>
      </Card>
    </div>
  );
}

// ── Goal Chat ──────────────────────────────────────────────────────────────────
function GoalChat({ goal, session }) {
  const [messages, setMessages] = useState([{
    role: "ai",
    text: "I'm your AI performance coach. Ask me anything about your goal — strategy, prioritization, obstacles, or what to focus on right now.",
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
      text: ok ? data.answer : "Could not get a response. Please try again.",
    }]);
    setLoading(false);
  }

  const suggestions = [
    "What should I focus on today?",
    "How do I get my first paying customer?",
    "What's my biggest risk right now?",
    "Give me a 30-day sprint plan.",
    "How do I generate revenue fastest?",
  ];

  return (
    <div style={{ animation: "fade-up 0.2s ease" }}>
      <Label icon="◈">AI Coach</Label>

      {/* Chat window */}
      <div style={{
        background: C.bgInput, border: `1px solid ${C.cyanBorder}`,
        borderRadius: 12, padding: 16, minHeight: 300, maxHeight: 440,
        overflowY: "auto", display: "flex", flexDirection: "column",
        gap: 12, marginBottom: 12,
      }}>
        {messages.map((m, i) => (
          <div key={i} className="chat-msg" style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "86%", padding: "12px 16px", fontSize: 15, lineHeight: 1.75,
              background: m.role === "user" ? C.cyanDim : C.bgCard,
              border: `1px solid ${m.role === "user" ? C.cyanBorder : C.textDim}`,
              color: m.role === "user" ? C.cyan : C.text,
              borderRadius: 10,
              borderBottomRightRadius: m.role === "user" ? 3 : 10,
              borderBottomLeftRadius:  m.role === "ai"   ? 3 : 10,
            }}>
              {m.role === "ai" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
                  AI Coach
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "12px 16px", borderRadius: 10, background: C.bgCard, border: `1px solid ${C.textDim}`, display: "flex", alignItems: "center", gap: 10, color: C.textSub }}>
              <Spinner size={14} /> Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions (first load only) */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} className="chip"
              style={{
                padding: "7px 14px", fontSize: 13, color: C.textSub,
                background: "transparent", border: `1px solid ${C.textDim}`,
                borderRadius: 20, cursor: "pointer",
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
          style={{ flex: 1, padding: "12px 16px", border: `1px solid ${C.cyanBorder}`, borderRadius: 8 }}
        />
        <Btn onClick={send} disabled={!input.trim() || loading} loading={loading}>Send</Btn>
      </div>
    </div>
  );
}

// ── Upgrade Modal ──────────────────────────────────────────────────────────────
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
      id: "pro", label: "Pro", price: "$12", period: "/month",
      accent: C.cyan, variant: "secondary", badge: "Most Popular",
      features: ["20 active goals", "Daily AI coaching", "Detailed action plans", "AI goal chat"],
    },
    {
      id: "growth", label: "Growth", price: "$29", period: "/month",
      accent: C.purple, variant: "purple", badge: "Best Value",
      features: ["Unlimited goals", "Everything in Pro", "Priority AI responses", "Advanced analytics"],
    },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: C.bgOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 520, animation: "fade-up 0.3s ease" }}>
        <Card>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 22, borderRadius: 4, lineHeight: 1 }}>×</button>

          <Label icon="✦" color={C.gold}>Upgrade</Label>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Unlock Your Full Potential</h2>
          <p style={{ fontSize: 15, color: C.textSub, marginBottom: 28, lineHeight: 1.65 }}>
            More goals, unlimited coaching, and advanced tools to keep your momentum going.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{
                border: `1px solid ${plan.accent}33`, borderRadius: 10,
                padding: "20px 22px", background: `${plan.accent}06`,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: plan.accent }}>{plan.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: plan.accent, background: `${plan.accent}15`, border: `1px solid ${plan.accent}33`, borderRadius: 20, padding: "2px 9px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {plan.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 14, lineHeight: 1 }}>
                    {plan.price}<span style={{ fontSize: 14, color: C.textSub, fontWeight: 500 }}>{plan.period}</span>
                  </div>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                      <span style={{ color: plan.accent, fontSize: 14, fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 14, color: C.textSub }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Btn onClick={() => handleUpgrade(plan.id)} loading={loading === plan.id}
                  disabled={currentPlan === plan.id} variant={plan.variant} style={{ flexShrink: 0, marginTop: 4 }}>
                  {currentPlan === plan.id ? "Current" : "Select"}
                </Btn>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 22 }}>
            Secured by Stripe · Cancel anytime · No hidden fees
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────────
function ProfilePage({ session, profile, onBack, onLogout, onNavigate }) {
  const [copiedRef, setCopiedRef]   = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg]           = useState(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [openFaq, setOpenFaq]       = useState(null);

  const refLink = `${window.location.origin}/?ref=${session.user.id.slice(0, 8)}`;

  function copyRef() {
    navigator.clipboard.writeText(refLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }

  async function sendPasswordReset() {
    setChangingPw(true);
    await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: window.location.origin,
    });
    setPwMsg("Password reset email sent — check your inbox.");
    setChangingPw(false);
  }

  async function deleteAccount() {
    setDeleting(true);
    const { ok } = await api("/account", { method: "DELETE", token: session.access_token });
    if (ok) {
      await supabase.auth.signOut();
    } else {
      setDeleting(false);
      alert("Failed to delete account. Please contact support@momentumx.app");
    }
  }

  const divider = <div style={{ height: 1, background: C.textDim, margin: "20px 0" }} />;

  const faqs = [
    { q: "How does the AI coach work?",
      a: "MomentumX uses a large language model to analyze your specific goal and build a personalized action plan. Each day it generates a fresh coaching tip tailored to where you are in your journey. You can also chat with it anytime for strategy, obstacles, or next-step advice." },
    { q: "How accurate is the AI advice?",
      a: "The AI is trained on a vast range of productivity, goal-achievement, and business knowledge. It gives solid, actionable guidance — but it's not a licensed professional advisor. For financial, legal, or medical goals, use AI for strategy and motivation, and consult a qualified expert for specific decisions." },
    { q: "Will my progress be saved?",
      a: "Yes. Goals and action plans are stored in your account. Step completion is stored locally on your device for fast performance — if you clear browser data or switch devices, step progress may reset, but your goals and plans will remain." },
    { q: "What's the difference between Free, Pro, and Growth?",
      a: "Free gives you 1 active goal. Pro ($12/mo) gives you 20 goals with daily AI coaching. Growth ($29/mo) is unlimited goals with everything in Pro plus priority AI responses and advanced analytics." },
    { q: "How do I cancel my subscription?",
      a: "Cancel anytime through your Stripe billing portal. Your access continues until the end of the current billing period. To access the portal email support@momentumx.app." },
    { q: "What data do you store?",
      a: "We store your email, your goals, AI-generated plans, and daily coaching history. We do not sell your data to third parties. See our Privacy Policy for full details." },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, fontSize: 14, fontWeight: 600, padding: 0, cursor: "pointer", marginBottom: 28 }}>
        ← Dashboard
      </button>

      {/* Account */}
      <Card style={{ marginBottom: 20 }}>
        <Label icon="👤">Account</Label>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: C.cyanDim, border: `2px solid ${C.cyanBorder}`,
              color: C.cyan, fontSize: 20, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {session.user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{session.user.email}</div>
              <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <PlanBadge plan={profile?.plan || "free"} />
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  · Member since {new Date(session.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <Btn onClick={onLogout} variant="ghost" size="sm">Sign Out</Btn>
        </div>

        {divider}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Password</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 3 }}>We'll send a password reset link to your email.</div>
          </div>
          <Btn onClick={sendPasswordReset} loading={changingPw} variant="secondary" size="sm">Change Password</Btn>
        </div>
        {pwMsg && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.greenDim, border: `1px solid ${C.greenBorder}`, borderRadius: 8, fontSize: 13, color: C.green }}>
            {pwMsg}
          </div>
        )}

        {divider}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.red }}>Delete Account</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 3 }}>Permanently removes your account and all data. Cannot be undone.</div>
          </div>
          {!delConfirm
            ? <Btn onClick={() => setDelConfirm(true)} variant="danger" size="sm">Delete Account</Btn>
            : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>Are you sure?</span>
                <Btn onClick={deleteAccount} loading={deleting} variant="danger" size="sm">Yes, Delete</Btn>
                <Btn onClick={() => setDelConfirm(false)} variant="ghost" size="sm">Cancel</Btn>
              </div>
            )
          }
        </div>
      </Card>

      {/* Refer a Friend */}
      <Card style={{ marginBottom: 20, borderColor: C.goldBorder }}>
        <Label icon="🎁" color={C.gold}>Refer a Friend</Label>
        <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.75, marginBottom: 20 }}>
          Know someone who wants to reach their goals faster? Share your link below. Referral rewards coming soon!
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            flex: 1, minWidth: 0, padding: "11px 16px",
            background: C.bgInput, border: `1px solid ${C.cyanBorder}`,
            borderRadius: 8, fontSize: 13, color: C.textSub,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {refLink}
          </div>
          <Btn onClick={copyRef} variant={copiedRef ? "green" : "secondary"} size="sm" style={{ flexShrink: 0 }}>
            {copiedRef ? "✓ Copied!" : "Copy Link"}
          </Btn>
        </div>
      </Card>

      {/* Help / FAQ */}
      <Card style={{ marginBottom: 20 }}>
        <Label icon="❓">Help & FAQ</Label>
        {faqs.map((item, i) => (
          <div key={i} style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${C.textDim}` : "none" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: "100%", background: "none", border: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 0", cursor: "pointer", gap: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, textAlign: "left", lineHeight: 1.4 }}>{item.q}</span>
              <span style={{
                color: C.textSub, fontSize: 16, flexShrink: 0,
                display: "inline-block",
                transform: openFaq === i ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▾</span>
            </button>
            {openFaq === i && (
              <div style={{ paddingBottom: 18, fontSize: 14, color: C.textSub, lineHeight: 1.85 }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Legal */}
      <Card>
        <Label icon="📄">Legal</Label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={() => onNavigate("privacy")} variant="ghost" size="sm">Privacy Policy</Btn>
          <Btn onClick={() => onNavigate("terms")}   variant="ghost" size="sm">Terms of Service</Btn>
          <a
            href="mailto:support@momentumx.app"
            style={{
              display: "inline-flex", alignItems: "center", fontSize: 12,
              color: C.textSub, textDecoration: "none",
              padding: "7px 14px", border: `1px solid ${C.textMuted}`, borderRadius: 8,
              transition: "color 0.15s",
            }}
          >
            Contact Support ↗
          </a>
        </div>
      </Card>
    </div>
  );
}

// ── Privacy Page ───────────────────────────────────────────────────────────────
function PrivacyPage({ onBack }) {
  const sections = [
    { title: "Information We Collect",
      body: "We collect your email address when you create an account. We store the goals you create, the AI-generated action plans, and your daily coaching history. Payment details are processed by Stripe — we never see your card number." },
    { title: "How We Use Your Information",
      body: "Your email is used for account-related messages (password resets, email confirmations). Your goals and plans are used to generate personalized AI coaching. We do not use your goal data for advertising or share it with third parties." },
    { title: "Data Storage & Security",
      body: "Your data is stored securely in Supabase, with industry-standard encryption and HTTPS on all connections. We retain your data for as long as your account is active. You may delete your account at any time from the Account page." },
    { title: "AI & Third-Party Services",
      body: "MomentumX uses Groq to generate coaching content. When you generate a plan or ask the AI a question, your goal text is sent to Groq's API to produce a response. Groq does not store your queries beyond the immediate request." },
    { title: "Cookies & Local Storage",
      body: "We use browser localStorage to store your step completion progress locally on your device — this data never leaves your browser. We do not use tracking cookies or third-party analytics tools." },
    { title: "Your Rights",
      body: "You have the right to access, export, or delete your data at any time. To delete your account and all associated data, go to Account → Delete Account. For data export requests, email support@momentumx.app." },
    { title: "Contact",
      body: "For any privacy-related questions, contact us at support@momentumx.app." },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, fontSize: 14, fontWeight: 600, padding: 0, cursor: "pointer", marginBottom: 28 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 36 }}>Last updated: June 2026</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, maxWidth: 680 }}>
        {sections.map(s => (
          <div key={s.title}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.85 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Terms Page ─────────────────────────────────────────────────────────────────
function TermsPage({ onBack }) {
  const sections = [
    { title: "Acceptance of Terms",
      body: "By creating an account and using MomentumX, you agree to these Terms of Service. If you do not agree, please do not use the service." },
    { title: "What MomentumX Provides",
      body: "MomentumX is an AI-powered goal-coaching platform. We provide personalized action plans and daily coaching tips generated by artificial intelligence. This guidance is for informational and motivational purposes only and does not constitute professional financial, legal, medical, or other licensed professional advice." },
    { title: "Account Responsibilities",
      body: "You are responsible for maintaining the security of your account credentials. You agree not to use MomentumX for any illegal purpose, to harass others, or to attempt to abuse or reverse-engineer our AI systems." },
    { title: "Subscriptions & Billing",
      body: "Paid plans (Pro and Growth) are billed monthly via Stripe. You may cancel at any time — access continues until the end of the billing period. We do not offer refunds for partial months. Prices may change with 30 days' notice to active subscribers." },
    { title: "Limitation of Liability",
      body: "MomentumX is provided \"as is.\" We are not liable for any outcomes resulting from following AI-generated advice. We do not guarantee that you will achieve any specific goal or result. Use the platform at your own discretion." },
    { title: "Intellectual Property",
      body: "The MomentumX platform, brand, and codebase are our property. The action plans and coaching content generated for you are yours to use for personal goal achievement." },
    { title: "Termination",
      body: "You may delete your account at any time from the Account page. We reserve the right to suspend or terminate accounts that violate these Terms." },
    { title: "Changes to Terms",
      body: "We may update these Terms occasionally. We will notify active users of significant changes via email. Continued use of the service after changes constitutes acceptance of the new Terms." },
    { title: "Contact",
      body: "For questions about these Terms, contact us at support@momentumx.app." },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, fontSize: 14, fontWeight: 600, padding: 0, cursor: "pointer", marginBottom: 28 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 36 }}>Last updated: June 2026</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, maxWidth: 680 }}>
        {sections.map(s => (
          <div key={s.title}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.85 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
