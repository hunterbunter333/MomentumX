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

      @keyframes orb-drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33%       { transform: translate(40px, -30px) scale(1.04); }
        66%       { transform: translate(-20px, 20px) scale(0.97); }
      }
      @keyframes gradient-pan {
        0%, 100% { background-position: 0% 50%; }
        50%       { background-position: 100% 50%; }
      }
      @keyframes fade-in {
        from { opacity: 0; } to { opacity: 1; }
      }

      /* Gradient text utilities */
      .grad-text {
        background: linear-gradient(135deg, #00d4ff 0%, #7ee8ff 55%, #c2f4ff 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .grad-text-warm {
        background: linear-gradient(135deg, #ffc947 0%, #ff8c42 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .grad-text-purple {
        background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* Auth two-column layout */
      .auth-layout {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 80px;
        align-items: center;
        width: 100%;
        max-width: 1060px;
        margin: 0 auto;
      }
      @media (max-width: 820px) {
        .auth-layout { grid-template-columns: 1fr; gap: 40px; }
        .auth-brand  { display: none !important; }
        .auth-form   { max-width: 440px; margin: 0 auto; width: 100%; }
      }

      /* Gradient border card */
      .grad-border-wrap { border-radius: 14px; padding: 1px; }
      .grad-border-inner { background: ${C.bgCard}; border-radius: 13px; }

      /* Stat number */
      .stat-num { font-variant-numeric: tabular-nums; }

      /* Glow btn */
      .btn-glow { box-shadow: 0 0 24px rgba(0,212,255,0.25), 0 4px 16px rgba(0,0,0,0.4) !important; }
      .btn-glow:hover:not(:disabled) { box-shadow: 0 0 36px rgba(0,212,255,0.38), 0 6px 20px rgba(0,0,0,0.45) !important; }

      /* Floating animation for product preview */
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(-1deg); }
        50%       { transform: translateY(-14px) rotate(0.5deg); }
      }
      @keyframes glow-breathe {
        0%, 100% { box-shadow: 0 0 28px rgba(0,212,255,0.3), 0 4px 20px rgba(0,0,0,0.4); }
        50%       { box-shadow: 0 0 48px rgba(0,212,255,0.55), 0 4px 20px rgba(0,0,0,0.4); }
      }
      @keyframes shimmer {
        from { background-position: -200% center; }
        to   { background-position:  200% center; }
      }

      /* Animated gradient text */
      .grad-text-animated {
        background: linear-gradient(135deg, #00d4ff 0%, #7ee8ff 30%, #c2f4ff 50%, #7ee8ff 70%, #00d4ff 100%);
        background-size: 200% auto;
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 4s linear infinite;
      }

      /* Landing hero layout */
      .landing-hero {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 72px;
        align-items: start;
        max-width: 1120px;
        margin: 0 auto;
      }
      @media (max-width: 860px) {
        .landing-hero { grid-template-columns: 1fr; gap: 40px; }
        .landing-hero > div:last-child { max-width: 480px; }
      }

      /* Landing sections */
      .landing-section { padding: 96px 24px; }
      .landing-section-inner { max-width: 1120px; margin: 0 auto; }

      /* Plan cards — hover lift */
      .plan-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
      .plan-card:hover { transform: translateY(-3px); }

      /* Trust logos */
      .trust-logo {
        font-size: 14px; font-weight: 800; color: ${C.textMuted};
        letter-spacing: 0.06em; opacity: 0.65;
        transition: opacity 0.15s;
      }
      .trust-logo:hover { opacity: 1; color: ${C.textSub}; }

      /* Sticky navbar */
      .landing-nav {
        position: sticky; top: 0; z-index: 200;
        background: rgba(8,13,26,0.85);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border-bottom: 1px solid ${C.textDim};
      }
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

// ── Grain Overlay ──────────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }} aria-hidden="true">
      <svg style={{ width: "100%", height: "100%", opacity: 0.038 }}>
        <filter id="mx-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mx-grain)" />
      </svg>
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
  const [streak, setStreak]             = useState(null);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [motivation, setMotivation]     = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setGoals([]); setProfile(null); setStreak(null); setMotivation(null); return; }
    fetchProfile();
    fetchGoals();
    doCheckin();
    fetchMotivation();
    fetchCheckinHistory();
    const p = new URLSearchParams(window.location.search);
    if (p.get("upgraded") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(fetchProfile, 1500);
    }
  }, [session]);

  async function doCheckin() {
    const { ok, data } = await api("/checkin", { method: "POST", token: session?.access_token });
    if (ok) setStreak(data);
  }
  async function fetchMotivation() {
    const { ok, data } = await api("/motivation", { token: session?.access_token });
    if (ok && data?.message) setMotivation(data.message);
  }
  async function fetchCheckinHistory() {
    const { ok, data } = await api("/checkin/history", { token: session?.access_token });
    if (ok && data?.dates) setCheckinHistory(data.dates);
  }

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

  if (!session) return <><GlobalStyles /><GrainOverlay /><AuthPage /></>;

  // Show onboarding for new users (profile loaded but onboarding not done)
  if (profile && !profile.onboarding_done) {
    return (
      <>
        <GlobalStyles />
        <GrainOverlay />
        <OnboardingQuiz
          session={session}
          onComplete={() => fetchProfile()}
        />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <GrainOverlay />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ cursor: "pointer" }} onClick={() => setPage("dashboard")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Diamond mark */}
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: "linear-gradient(135deg, #00d4ff, #0090b8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 14px rgba(0,212,255,0.35)",
              }}>
                <span style={{ fontSize: 11, color: "#07111f", fontWeight: 900 }}>MX</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
                <span className="grad-text" style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.5px" }}>Momentum</span>
                <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.5px", color: C.text }}>X</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, paddingLeft: 36 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "pulse-dot 2.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>AI Coach Active</span>
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
            streak={streak} motivation={motivation} checkinHistory={checkinHistory}
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

// ── Onboarding Quiz ────────────────────────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: "goal_type",
    question: "What kind of goal are you working on?",
    sub: "We'll personalize your AI coaching around your answer.",
    options: [
      { value: "income",   label: "💰 Make more money",         desc: "Side hustle, business, or career growth" },
      { value: "health",   label: "💪 Health & fitness",        desc: "Lose weight, build muscle, improve diet" },
      { value: "skills",   label: "📚 Learn a new skill",       desc: "Coding, language, music, or other skill" },
      { value: "personal", label: "🧠 Personal development",    desc: "Mindset, habits, productivity, confidence" },
      { value: "other",    label: "✨ Something else",          desc: "I'll describe it when I create my goal" },
    ],
  },
  {
    id: "daily_time",
    question: "How much time can you commit each day?",
    sub: "Your AI coach will create a plan that fits your schedule.",
    options: [
      { value: "15min",  label: "⚡ 15–30 minutes",  desc: "Quick wins, habit stacking" },
      { value: "1hr",    label: "🎯 30–60 minutes",  desc: "Focused daily sessions" },
      { value: "2hr",    label: "🔥 1–2 hours",      desc: "Serious momentum building" },
      { value: "allIn",  label: "🚀 3+ hours",       desc: "Full-time focus on this goal" },
    ],
  },
  {
    id: "biggest_challenge",
    question: "What's your biggest obstacle right now?",
    sub: "Your coach will address this head-on in every plan.",
    options: [
      { value: "consistency", label: "🔄 Staying consistent",      desc: "Starting strong but losing steam" },
      { value: "clarity",     label: "🗺️ Knowing what to do next", desc: "Overwhelmed or unsure where to start" },
      { value: "time",        label: "⏰ Not enough time",          desc: "Life is busy and chaotic" },
      { value: "motivation",  label: "😴 Staying motivated",       desc: "Hard to push through tough days" },
      { value: "resources",   label: "💸 Limited money or tools",  desc: "Working with constraints" },
    ],
  },
  {
    id: "motivation",
    question: "What drives you most?",
    sub: "Your coach will speak your language to keep you pushing.",
    options: [
      { value: "freedom",   label: "🌍 Financial freedom",      desc: "Escape the 9–5, own my time" },
      { value: "family",    label: "👨‍👩‍👧 Provide for my family", desc: "Build something for the people I love" },
      { value: "prove",     label: "🏆 Prove myself",           desc: "Achieve something most people can't" },
      { value: "growth",    label: "📈 Personal growth",        desc: "Become the best version of myself" },
      { value: "impact",    label: "💡 Make an impact",         desc: "Create something that matters" },
    ],
  },
];

function OnboardingQuiz({ session, onComplete }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const current = QUIZ_STEPS[step];
  const progress = ((step) / QUIZ_STEPS.length) * 100;

  async function selectOption(value) {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      // Brief delay for selection feel, then advance
      setTimeout(() => setStep(s => s + 1), 220);
    } else {
      // Last step — save and complete
      setSaving(true);
      setError(null);
      const { ok, data } = await api("/profile/onboarding", {
        method: "PATCH",
        token: session.access_token,
        body: {
          goal_type: newAnswers.goal_type,
          daily_time: newAnswers.daily_time,
          biggest_challenge: newAnswers.biggest_challenge,
          motivation: newAnswers.motivation,
        },
      });
      setSaving(false);
      if (!ok) {
        setError(data?.error || "Failed to save. Please try again.");
        return;
      }
      onComplete();
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
      {/* Ambient orbs */}
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07), transparent 65%)", animation: "orb-drift 18s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.06), transparent 65%)", animation: "orb-drift 24s ease-in-out infinite reverse", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 560, position: "relative" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #00d4ff, #0090b8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(0,212,255,0.35)" }}>
            <span style={{ fontSize: 11, color: "#07111f", fontWeight: 900 }}>MX</span>
          </div>
          <span className="grad-text" style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.3px" }}>MomentumX</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Step {step + 1} of {QUIZ_STEPS.length}
            </span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{Math.round(((step + 1) / QUIZ_STEPS.length) * 100)}% complete</span>
          </div>
          <div style={{ height: 3, background: C.bgInput, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: "linear-gradient(90deg, #00d4ff, #a855f7)",
              width: `${((step + 1) / QUIZ_STEPS.length) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Question */}
        <div key={step} style={{ animation: "fade-in 0.25s ease" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.5px" }}>
            {current.question}
          </h1>
          <p style={{ fontSize: 15, color: C.textSub, marginBottom: 28, lineHeight: 1.6 }}>{current.sub}</p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => !saving && selectOption(opt.value)}
                  disabled={saving}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px", borderRadius: 12, cursor: saving ? "not-allowed" : "pointer",
                    background: selected ? "rgba(0,212,255,0.1)" : C.bgCard,
                    border: `1px solid ${selected ? C.cyan : C.cyanBorder}`,
                    boxShadow: selected ? "0 0 0 1px rgba(0,212,255,0.2), 0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.25)",
                    textAlign: "left", transition: "all 0.15s ease",
                  }}
                  className="card-hover"
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: selected ? C.cyan : C.text, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: C.textSub }}>{opt.desc}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${selected ? C.cyan : C.textMuted}`,
                    background: selected ? C.cyan : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#07111f" }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <ErrorBox msg={error} />}

          {saving && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, color: C.textSub, fontSize: 14 }}>
              <Spinner size={14} /> Setting up your personalized experience...
            </div>
          )}
        </div>

        {/* Back button */}
        {step > 0 && !saving && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{ marginTop: 24, background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

// ── Product Preview Mockup ─────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <div style={{ animation: "float 7s ease-in-out infinite", transformOrigin: "center bottom", maxWidth: 420 }}>
      {/* Browser chrome */}
      <div style={{
        background: "#0a1525", borderRadius: 14,
        border: "1px solid rgba(0,212,255,0.2)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}>
        {/* Chrome bar */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,212,255,0.08)", display: "flex", alignItems: "center", gap: 8, background: "#06101e" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />
            ))}
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 5, padding: "3px 10px", fontSize: 10, color: "#3a5a70", textAlign: "center", letterSpacing: "0.02em" }}>
            app.momentumx.ai
          </div>
        </div>

        {/* App content */}
        <div style={{ padding: "18px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#2a4460", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Good morning</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#ddeeff", letterSpacing: "-0.5px", marginTop: 2 }}>
                Let's build <span style={{ background: "linear-gradient(135deg,#00d4ff,#7ee8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>momentum.</span>
              </div>
            </div>
            {/* Streak badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: "rgba(255,201,71,0.09)", border: "1px solid rgba(255,201,71,0.25)" }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#ffc947" }}>14</span>
              <span style={{ fontSize: 9, color: "#5e8eaa", fontWeight: 600 }}>day streak</span>
            </div>
          </div>

          {/* AI Coach message */}
          <div style={{ padding: "12px 14px", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", borderLeft: "3px solid #00d4ff", borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#00d4ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>🤖 Today's AI Coach</div>
            <div style={{ fontSize: 11, color: "#9bb8cc", lineHeight: 1.65, fontStyle: "italic" }}>
              "You're 14 days in — momentum is compounding. Today: spend 25 min on your Gumroad product page. Small wins build unstoppable habits."
            </div>
          </div>

          {/* Goal card */}
          <div style={{ background: "#0d1626", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ddeeff", letterSpacing: "-0.2px" }}>Launch digital product</div>
                <div style={{ fontSize: 9, color: "#5e8eaa", marginTop: 2 }}>Income · Day 14 of 90</div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 7px", borderRadius: 10 }}>Active</div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: "#2a4460", fontWeight: 600 }}>PROGRESS</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#00d4ff" }}>68%</span>
              </div>
              <div style={{ height: 4, background: "#0f1d30", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "68%", background: "linear-gradient(90deg,#00d4ff,#00b5d8)", borderRadius: 2 }} />
              </div>
            </div>

            {/* Steps */}
            {[
              { done: true,  label: "Research 5 profitable niches" },
              { done: true,  label: "Validate with 10 Reddit threads" },
              { done: false, label: "Build Gumroad product page" },
              { done: false, label: "Write 3 promo tweets" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0", borderBottom: i < 3 ? "1px solid rgba(21,32,48,0.8)" : "none" }}>
                <div style={{
                  width: 13, height: 13, borderRadius: 4, flexShrink: 0,
                  background: step.done ? "linear-gradient(135deg,#00d4ff,#00b5d8)" : "transparent",
                  border: step.done ? "none" : "1px solid #152030",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.done && <span style={{ fontSize: 7, color: "#07111f", fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 9.5, color: step.done ? "#5e8eaa" : "#9bb8cc", textDecoration: step.done ? "line-through" : "none", lineHeight: 1.4 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Check-in strip */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#2a4460", letterSpacing: "0.06em", textTransform: "uppercase" }}>This Week</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#00d4ff" }}>86% consistent</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{
                    width: "100%", aspectRatio: "1", borderRadius: 4,
                    background: i < 6 ? "linear-gradient(135deg,#00d4ff,#00b5d8)" : "#0f1d30",
                    border: i === 6 ? "1px solid rgba(0,212,255,0.25)" : "none",
                    boxShadow: i < 6 ? "0 0 5px rgba(0,212,255,0.3)" : "none",
                  }} />
                  <span style={{ fontSize: 7, color: i === 6 ? "#00d4ff" : "#2a4460" }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auth Page ──────────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode]         = useState("signup");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [message, setMessage]   = useState(null);
  const formRef    = useRef(null);
  const pricingRef = useRef(null);
  function scrollToForm() { formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }

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

  const FEATURES = [
    { icon: "🎯", label: "AI-personalized plan" },
    { icon: "📅", label: "Daily coaching" },
    { icon: "🔥", label: "Streak tracking" },
    { icon: "📊", label: "Progress insights" },
  ];

  const HOW_STEPS = [
    {
      num: "01", icon: "🎯", color: C.cyan,
      title: "Tell the AI your goal",
      body: "Describe what you want to achieve in plain language — earn more money, get fit, build a skill. The more specific, the better your plan."
    },
    {
      num: "02", icon: "⚡", color: C.green,
      title: "Get your personalized plan",
      body: "The AI asks a few quick questions, then builds a step-by-step action plan tailored to your situation — not generic templates."
    },
    {
      num: "03", icon: "🔥", color: C.purple,
      title: "Show up daily and build momentum",
      body: "Check in each day, get a fresh coaching tip, and track your streak. Your coach adapts as you make progress."
    },
  ];


  const PRICING = [
    {
      id: "free", label: "Free", accent: C.textSub, border: C.textMuted,
      price: "$0", period: "/ forever",
      desc: "Everything you need to get started.",
      popular: false,
      cta: "Start Free",
      features: [
        "1 active goal",
        "AI-generated action plan",
        "Daily coaching messages",
        "7-day check-in calendar",
        "Streak tracking",
      ],
    },
    {
      id: "pro", label: "Pro", accent: C.cyan, border: "rgba(0,212,255,0.35)",
      price: "$12", period: "/ month",
      desc: "For people serious about achieving goals.",
      popular: true,
      cta: "Start 7-Day Free Trial →",
      features: [
        "Up to 20 active goals",
        "30-day check-in history",
        "Longest streak tracking",
        "Priority AI responses",
        "Email accountability nudges",
      ],
    },
    {
      id: "growth", label: "Growth", accent: C.purple, border: "rgba(168,85,247,0.35)",
      price: "$29", period: "/ month",
      desc: "For high-achievers who never stop.",
      popular: false,
      cta: "Start 7-Day Free Trial →",
      features: [
        "Unlimited goals",
        "Everything in Pro",
        "Streak freeze (2 per month)",
        "Advanced progress analytics",
        "Early access to new features",
      ],
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Fixed ambient orbs */}
      <div style={{ position: "fixed", top: "-15%", left: "-8%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.045), transparent 68%)", filter: "blur(80px)", pointerEvents: "none", animation: "orb-drift 18s ease-in-out infinite", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-12%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.04), transparent 68%)", filter: "blur(80px)", pointerEvents: "none", animation: "orb-drift 22s ease-in-out infinite reverse", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "60%", left: "35%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,232,122,0.02), transparent 68%)", filter: "blur(60px)", pointerEvents: "none", animation: "orb-drift 14s ease-in-out infinite 4s", zIndex: 0 }} />

      {/* Top accent line */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent 0%, #00d4ff 30%, #a855f7 70%, transparent 100%)", zIndex: 9999, pointerEvents: "none" }} />

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #00d4ff, #0090b8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(0,212,255,0.35)" }}>
              <span style={{ fontSize: 10, color: "#07111f", fontWeight: 900 }}>MX</span>
            </div>
            <span className="grad-text" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.3px" }}>MomentumX</span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="btn"
              style={{ background: "none", border: "none", color: C.textSub, fontSize: 14, cursor: "pointer", padding: "8px 14px", borderRadius: 7, fontWeight: 600 }}
            >
              Pricing
            </button>
            <button
              onClick={() => { setMode("login"); setTimeout(scrollToForm, 50); }}
              className="btn"
              style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.cyanBorder}`, background: C.cyanDim, color: C.cyan, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "88px 24px 80px", position: "relative", zIndex: 1 }}>
        <div className="landing-hero">
          {/* Left column */}
          <div style={{ animation: "fade-up 0.45s ease" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(0,212,255,0.07)", border: `1px solid ${C.cyanBorder}`, borderRadius: 20, marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse-dot 2.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-POWERED GOAL COACHING</span>
            </div>

            {/* H1 */}
            <h1 style={{ fontSize: "clamp(48px, 6.5vw, 82px)", fontWeight: 900, lineHeight: 0.97, letterSpacing: "-4px", marginBottom: 26, color: C.text }}>
              Stop drifting.<br />
              <span className="grad-text-animated">Start achieving.</span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 18, color: C.textSub, lineHeight: 1.75, maxWidth: 500, marginBottom: 36 }}>
              Your AI coach turns ambitious goals into a clear daily action plan — then keeps you accountable until you win.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 14px", borderRadius: 20,
                  background: C.cyanDim, border: `1px solid ${C.cyanBorder}`,
                  fontSize: 13, color: C.textSub, fontWeight: 600,
                }}>
                  <span style={{ fontSize: 14 }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>

            {/* CTA pair */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
              <button
                onClick={scrollToForm}
                className="btn"
                style={{
                  padding: "15px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer",
                  background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f",
                  border: "none", borderRadius: 10, letterSpacing: "-0.2px",
                  animation: "glow-breathe 3.5s ease-in-out infinite",
                }}
              >
                Start for Free →
              </button>
              <button
                onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="btn"
                style={{
                  padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  background: "transparent", color: C.textSub,
                  border: `1px solid ${C.textMuted}`, borderRadius: 10,
                }}
              >
                See pricing ↓
              </button>
            </div>

            {/* Product preview below CTAs */}
            <ProductPreview />
          </div>

          {/* Right column: sticky form */}
          <div ref={formRef} style={{ position: "sticky", top: 90, animation: "fade-up 0.45s ease 0.1s both" }}>
            <Card style={{ boxShadow: "0 0 0 1px rgba(0,212,255,0.14), 0 32px 80px rgba(0,0,0,0.65), 0 0 100px rgba(0,212,255,0.05)", padding: 28 }}>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 21, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: "-0.5px" }}>
                  {mode === "login" ? "Welcome back" : "Create your free account"}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  {mode === "login" ? "Sign in to continue" : "No credit card required · Free forever"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, margin: "22px 0 24px", background: C.bgInput, borderRadius: 8, padding: 4 }}>
                {["signup", "login"].map(m => (
                  <button key={m} className="tab"
                    onClick={() => { setMode(m); setError(null); setMessage(null); }}
                    style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 6, border: "none", background: mode === m ? C.cyanDim : "transparent", color: mode === m ? C.cyan : C.textSub, boxShadow: mode === m ? `0 0 0 1px ${C.cyanBorder}` : "none" }}>
                    {m === "signup" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, letterSpacing: "0.03em" }}>Email</div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, letterSpacing: "0.03em" }}>Password</div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 8 characters" style={inp} />
                </div>
                <Btn fullWidth loading={loading} size="lg"
                  style={{ marginTop: 4, background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f", border: "none", fontSize: 15, fontWeight: 800, boxShadow: "0 0 28px rgba(0,212,255,0.3), 0 4px 16px rgba(0,0,0,0.4)" }}>
                  {mode === "login" ? "Sign In →" : "Get Started Free →"}
                </Btn>
              </form>

              <ErrorBox msg={error} />
              {message && (
                <div style={{ marginTop: 16, padding: "13px 16px", background: C.greenDim, border: `1px solid ${C.greenBorder}`, borderRadius: 8, fontSize: 14, color: C.green, lineHeight: 1.55 }}>
                  {message}
                </div>
              )}

              {!error && !message && (
                <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
                  {["🔒 Secure", "✦ Free forever", "⚡ 60-sec setup"].map(f => (
                    <span key={f} style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 900, color: C.text, lineHeight: 1.03, letterSpacing: "-2.5px", marginBottom: 16 }}>
              From vague idea to<br /><span className="grad-text">daily action plan</span>
            </h2>
            <p style={{ fontSize: 17, color: C.textSub, maxWidth: 520, margin: "0 auto" }}>
              In under 60 seconds, MomentumX gives you a personalized roadmap you can actually follow.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {HOW_STEPS.map((s) => (
              <div key={s.num} className="plan-card" style={{
                background: C.bgCard, border: `1px solid ${s.color}22`,
                borderRadius: 16, padding: "32px 28px",
                boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 110, height: 110, borderRadius: "50%", background: `${s.color}07`, pointerEvents: "none" }} />
                <div style={{ fontSize: 44, fontWeight: 900, color: `${s.color}18`, letterSpacing: "-2px", lineHeight: 1, marginBottom: 20, fontVariantNumeric: "tabular-nums" }}>
                  {s.num}
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 18 }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.25, letterSpacing: "-0.4px" }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section ref={pricingRef} className="landing-section" style={{ borderTop: `1px solid ${C.textDim}`, position: "relative", zIndex: 1 }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 16 }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 900, color: C.text, lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 14 }}>
              Start free.<br />Scale when you're ready.
            </h2>
            <p style={{ fontSize: 16, color: C.textSub }}>No credit card required. Upgrade anytime.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, maxWidth: 920, margin: "0 auto" }}>
            {PRICING.map(p => (
              <div key={p.id} className="plan-card" style={{
                background: p.popular ? "linear-gradient(145deg, rgba(0,212,255,0.07), rgba(0,212,255,0.02))" : C.bgCard,
                border: `1px solid ${p.popular ? "rgba(0,212,255,0.4)" : p.border}`,
                borderRadius: 16, padding: "32px 26px",
                boxShadow: p.popular ? "0 0 0 1px rgba(0,212,255,0.12), 0 24px 64px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.35)",
                position: "relative", display: "flex", flexDirection: "column",
              }}>
                {p.popular && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f",
                    fontSize: 10, fontWeight: 900, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.09em", whiteSpace: "nowrap",
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: "auto" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: p.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.label}</div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 46, fontWeight: 900, color: C.text, letterSpacing: "-2.5px", lineHeight: 1 }}>{p.price}</span>
                    <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500, marginLeft: 5 }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{p.desc}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ color: p.popular ? C.cyan : C.green, fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 14, color: C.textSub, lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={scrollToForm}
                  className="btn"
                  style={{
                    display: "block", width: "100%", padding: "13px 0",
                    fontSize: 14, fontWeight: 800, cursor: "pointer",
                    background: p.popular ? "linear-gradient(135deg, #00d4ff, #00b5d8)" : "transparent",
                    color: p.popular ? "#07111f" : p.accent,
                    border: `1px solid ${p.popular ? "transparent" : p.border}`,
                    borderRadius: 10, letterSpacing: "-0.1px",
                    boxShadow: p.popular ? "0 0 24px rgba(0,212,255,0.3)" : "none",
                  }}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, marginTop: 28 }}>
            All paid plans include a 7-day free trial · Cancel anytime · Payments secured by Stripe
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "100px 24px", borderTop: `1px solid ${C.textDim}`, position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 20 }}>Ready?</div>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, color: C.text, lineHeight: 1.03, letterSpacing: "-3px", marginBottom: 20 }}>
            Your goal is<br /><span className="grad-text-animated">waiting.</span>
          </h2>
          <p style={{ fontSize: 18, color: C.textSub, lineHeight: 1.75, marginBottom: 40 }}>
            Stop putting it off. Your first AI-generated action plan takes 60 seconds to set up — and it's free.
          </p>
          <button
            onClick={scrollToForm}
            className="btn"
            style={{
              padding: "17px 44px", fontSize: 17, fontWeight: 800, cursor: "pointer",
              background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f",
              border: "none", borderRadius: 12, letterSpacing: "-0.3px",
              boxShadow: "0 0 48px rgba(0,212,255,0.4), 0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            Get Started Free — No CC Required →
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
            {["🔒 Bank-level security", "⚡ Setup in 60 seconds", "✦ Cancel anytime"].map(f => (
              <span key={f} style={{ fontSize: 12, color: C.textMuted }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.textDim}`, padding: "28px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg, #00d4ff, #0090b8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "#07111f", fontWeight: 900 }}>MX</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textMuted }}>MomentumX</span>
            <span style={{ fontSize: 13, color: C.textDim }}>© 2026</span>
          </div>
          <a href="mailto:momentumxapp@gmail.com" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none" }}>momentumxapp@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function CheckinCalendar({ checkinHistory, plan, onUpgrade }) {
  const isPro = plan === "pro" || plan === "growth";
  const days = isPro ? 30 : 7;
  const today = new Date().toISOString().slice(0, 10);
  // Always mark today as checked-in (user just logged in = they showed up)
  const checkedSet = new Set([...checkinHistory, today]);

  // Build array of last N days
  const slots = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
    slots.push({ key, label, checked: checkedSet.has(key), isToday: i === 0 });
  }

  const doneCount = slots.filter(s => s.checked).length;
  const pct = Math.round((doneCount / days) * 100);
  const pctColor = pct >= 80 ? C.green : pct >= 50 ? C.cyan : C.orange;

  if (!isPro) {
    // 7-day strip
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Last 7 Days</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: pctColor, fontWeight: 700 }}>{pct}% consistent</span>
            <button onClick={onUpgrade} style={{ background: "none", border: "none", fontSize: 11, color: C.gold, cursor: "pointer", fontWeight: 700, letterSpacing: "0.05em" }}>
              View 30 days ✦
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {slots.map(s => (
            <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: "100%", aspectRatio: "1", borderRadius: 6,
                background: s.checked ? "linear-gradient(135deg, #00d4ff, #00b5d8)" : C.bgInput,
                border: `1px solid ${s.isToday ? C.cyan : s.checked ? "transparent" : C.textDim}`,
                boxShadow: s.checked ? "0 0 8px rgba(0,212,255,0.3)" : "none",
              }} />
              <span style={{ fontSize: 9, color: s.isToday ? C.cyan : C.textMuted, fontWeight: s.isToday ? 700 : 400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 30-day grid for Pro+
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>30-Day Check-in History</span>
        <span style={{ fontSize: 11, color: pctColor, fontWeight: 700 }}>{doneCount} / 30 · {pct}% consistent</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
        {slots.map(s => (
          <div key={s.key} title={s.key} style={{
            aspectRatio: "1", borderRadius: 5,
            background: s.checked ? "linear-gradient(135deg, #00d4ff, #00b5d8)" : C.bgInput,
            border: `1px solid ${s.isToday ? C.cyan : s.checked ? "transparent" : C.textDim}`,
            boxShadow: s.checked ? "0 0 6px rgba(0,212,255,0.25)" : "none",
          }} />
        ))}
      </div>
    </div>
  );
}

function Dashboard({ goals, loading, profile, streak, motivation, checkinHistory, onNewGoal, onSelectGoal, onDeleteGoal, onUpgrade }) {
  const isAtLimit = profile?.plan === "free" && goals.length >= 1;
  const isPro = profile?.plan === "pro" || profile?.plan === "growth";
  const isGrowth = profile?.plan === "growth";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const currentStreak = streak?.current_streak ?? profile?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? profile?.longest_streak ?? 0;

  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => {
        try {
          const saved = JSON.parse(localStorage.getItem(`mx_steps_${g.id}`) || "[]");
          const total = g.plan?.steps?.length ?? 0;
          return sum + (total > 0 ? Math.round((saved.length / total) * 100) : 0);
        } catch { return sum; }
      }, 0) / goals.length)
    : 0;

  // Streak flame color based on length
  const flameColor = currentStreak >= 30 ? C.purple : currentStreak >= 7 ? C.orange : C.gold;

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* ── Motivational banner ── */}
      {motivation && (
        <div style={{
          marginBottom: 28, padding: "18px 22px",
          background: "linear-gradient(135deg, rgba(0,212,255,0.07), rgba(168,85,247,0.04), rgba(0,212,255,0.03))",
          border: `1px solid ${C.cyanBorder}`,
          borderLeft: `3px solid ${C.cyan}`,
          borderRadius: 12,
          display: "flex", alignItems: "flex-start", gap: 16,
          boxShadow: "0 4px 28px rgba(0,0,0,0.35), 0 0 60px rgba(0,212,255,0.04)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: C.cyanDim,
            border: `1px solid ${C.cyanBorder}`, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0, fontSize: 15,
          }}>🤖</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>Today's AI Coach</div>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.78, fontStyle: "italic", margin: 0 }}>
              "{motivation}"
            </p>
          </div>
        </div>
      )}

      {/* ── Greeting row ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              {dateStr}
            </p>
            <h1 style={{ fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1.5px", color: C.text, marginBottom: 8 }}>
              {greeting},<br />
              <span className="grad-text-animated">let's build momentum.</span>
            </h1>
            <p style={{ fontSize: 15, color: C.textSub, marginTop: 10 }}>
              {goals.length === 0
                ? "Set your first goal and get a personalized plan in under a minute."
                : `${goals.length} active goal${goals.length !== 1 ? "s" : ""}. Keep the momentum going.`}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {/* Streak badge */}
            {currentStreak > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 24,
                background: `rgba(255,201,71,0.09)`, border: `1px solid ${C.goldBorder}`,
                boxShadow: `0 0 20px rgba(255,201,71,0.12)`,
              }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: flameColor, letterSpacing: "-0.5px" }}>{currentStreak}</span>
                <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600 }}>day streak</span>
              </div>
            )}
            <Btn onClick={isAtLimit ? onUpgrade : onNewGoal} variant={isAtLimit ? "orange" : "primary"}
              style={!isAtLimit ? { background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", fontWeight: 800, boxShadow: "0 0 24px rgba(0,212,255,0.28), 0 4px 16px rgba(0,0,0,0.35)" } : {}}>
              {isAtLimit ? "Upgrade to Add More" : "+ New Goal"}
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Active Goals",   value: goals.length || "0",  color: C.cyan,   grad: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,212,255,0.03))",   border: C.cyanBorder },
          { label: "Avg. Progress",  value: `${avgProgress}%`,    color: C.green,  grad: "linear-gradient(135deg, rgba(0,232,122,0.1), rgba(0,232,122,0.03))",   border: C.greenBorder },
          { label: "Day Streak",     value: currentStreak || "0", color: flameColor, grad: "linear-gradient(135deg, rgba(255,201,71,0.1), rgba(255,201,71,0.03))", border: C.goldBorder },
        ].map(s => (
          <div key={s.label} style={{ background: s.grad, border: `1px solid ${s.border}`, borderRadius: 12, padding: "20px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
            <div className="stat-num" style={{ fontSize: 40, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-1.5px", marginBottom: 8, textShadow: `0 0 24px ${s.color}50` }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Longest streak badge (Pro+) ── */}
      {isPro && longestStreak > 0 && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>Personal best: {longestStreak}-day streak</span>
          {isGrowth && currentStreak > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.purple, fontWeight: 700, background: C.purpleDim, border: `1px solid ${C.purpleBorder}`, padding: "2px 8px", borderRadius: 10 }}>
              ❄️ Streak freeze available
            </span>
          )}
        </div>
      )}

      {/* ── Check-in calendar ── */}
      {checkinHistory !== null && (
        <CheckinCalendar checkinHistory={checkinHistory} plan={profile?.plan ?? "free"} onUpgrade={onUpgrade} />
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Spinner size={24} />
          <span style={{ fontSize: 14, color: C.textMuted }}>Loading your goals...</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && goals.length === 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(168,85,247,0.12), rgba(0,212,255,0.06))", borderRadius: 14, padding: 1, boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ background: C.bgCard, borderRadius: 13, textAlign: "center", padding: "64px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20, opacity: 0.8 }}>Get Started</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 12, letterSpacing: "-0.5px" }}>What's your goal?</h2>
              <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.8, maxWidth: 380, margin: "0 auto 32px" }}>
                Tell the AI your goal and get a personalized action plan with daily coaching — in under a minute.
              </p>
              <Btn onClick={onNewGoal} size="lg" style={{ background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", boxShadow: "0 0 28px rgba(0,212,255,0.28), 0 4px 16px rgba(0,0,0,0.4)" }}>
                Create My First Goal →
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Goal list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: goals.length > 0 ? 4 : 0 }}>
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onClick={() => onSelectGoal(goal)} onDelete={() => onDeleteGoal(goal.id)} />
        ))}
      </div>

      {/* ── Free plan nudge ── */}
      {!loading && profile?.plan === "free" && goals.length >= 1 && (
        <div style={{ marginTop: 20, padding: "16px 20px", background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 3 }}>Free plan — 1 goal limit</div>
            <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.55 }}>Upgrade to manage multiple goals, see your full 30-day history, and unlock unlimited AI coaching.</div>
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
    /* Gradient border wrapper */
    <div className="card-hover" onClick={onClick} style={{
      background: "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(168,85,247,0.15), rgba(0,212,255,0.08))",
      borderRadius: 14, padding: 1, cursor: "pointer",
      boxShadow: "0 4px 28px rgba(0,0,0,0.4)",
      transition: "box-shadow 0.2s ease, transform 0.15s ease",
    }}>
    <div style={{ background: C.bgCard, borderRadius: 13, padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 9, padding: "3px 10px", borderRadius: 20, background: C.cyanDim, border: `1px solid ${C.cyanBorder}` }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: "0.08em", textTransform: "uppercase" }}>Active</span>
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
      alert("Failed to delete account. Please contact momentumxapp@gmail.com");
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
      a: "Cancel anytime through your Stripe billing portal. Your access continues until the end of the current billing period. To access the portal email momentumxapp@gmail.com." },
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
            href="mailto:momentumxapp@gmail.com"
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
      body: "You have the right to access, export, or delete your data at any time. To delete your account and all associated data, go to Account → Delete Account. For data export requests, email momentumxapp@gmail.com." },
    { title: "Contact",
      body: "For any privacy-related questions, contact us at momentumxapp@gmail.com." },
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
      body: "For questions about these Terms, contact us at momentumxapp@gmail.com." },
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
