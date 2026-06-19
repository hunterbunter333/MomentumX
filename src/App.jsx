import React, { useState, useEffect, useRef } from "react";
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
        font-size: 16px !important;
        font-family: inherit !important;
      }
      input::placeholder, textarea::placeholder { color: ${C.textMuted} !important; }
      input:focus, textarea:focus {
        outline: none !important;
        border-color: ${C.cyan} !important;
        box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important;
      }

      button { font-family: inherit; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      a { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }

      @keyframes fade-up {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes confetti-fall {
        0%   { opacity: 0; transform: translateY(-20px) rotate(0deg) scale(0); }
        20%  { opacity: 1; }
        80%  { opacity: 0.7; }
        100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(1.2); }
      }
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

      /* ── Mobile responsive ───────────────────────────────────────────── */
      /* Hide mobile-only sign in button on desktop */
      .landing-nav-signin-mobile { display: none; }

      @media (max-width: 600px) {
        /* App shell */
        .app-shell { padding: 20px 14px 100px !important; }

        /* Landing nav */
        .landing-nav-inner { padding: 12px 16px !important; }
        .landing-nav-links { display: none !important; }
        .landing-nav-signin-mobile { display: flex !important; }

        /* Landing hero */
        .landing-hero { grid-template-columns: 1fr !important; gap: 32px !important; padding: 0 !important; }
        .landing-hero-title { font-size: 32px !important; line-height: 1.2 !important; }
        .landing-hero > div:last-child { display: none; }
        .landing-section { padding: 56px 16px !important; }

        /* Pricing grid */
        .pricing-grid { grid-template-columns: 1fr !important; }

        /* Features pill row */
        .features-row { gap: 8px !important; }

        /* Stat row */
        .stat-row { gap: 16px !important; flex-wrap: wrap; }
        .stat-row > div { flex: 1 1 calc(50% - 8px); min-width: 100px; }

        /* Dashboard goal cards */
        .goal-card-meta { flex-direction: column !important; gap: 6px !important; }

        /* Plan view tabs */
        .plan-tabs button { font-size: 11px !important; padding: 9px 0 !important; }

        /* Briefing card text */
        .briefing-msg { font-size: 14px !important; }

        /* SmartCalendar grid — 7 cols still fine but shrink cells */
        .cal-day { width: 36px !important; height: 36px !important; font-size: 11px !important; }

        /* Chat bubbles */
        .chat-bubble { max-width: 92% !important; font-size: 13px !important; }

        /* Modals */
        .modal-inner { padding: 24px 18px !important; margin: 16px !important; }

        /* Touch targets — all interactive elements min 44px */
        button, a, input, textarea, select { min-height: 44px; }
        input[type="checkbox"] { min-height: unset; }

        /* Safe area insets for iPhone notch/home bar */
        .app-shell { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
        .landing-nav { padding-top: env(safe-area-inset-top); }

        /* Bottom nav — show on mobile */
        .mobile-bottom-nav { display: flex !important; }

        /* Hide grain overlay on mobile — causes iOS touch interference */
        .grain-overlay { display: none !important; }

        /* Ensure all buttons/links are tappable on iOS */
        button, a, [role="button"] { cursor: pointer !important; }

        /* Prevent iOS input zoom — inputs must be 16px+ */
        input, textarea, select { font-size: 16px !important; }

        /* Remove ALL backdrop-filter and filter on mobile — #1 iOS touch bug cause */
        * { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
        .landing-nav { background: rgba(8,13,26,0.98) !important; }
        .mobile-bottom-nav { background: rgba(8,13,26,0.99) !important; }

        /* Hide ALL decorative blurred orbs on mobile — filter:blur on fixed elements breaks iOS touch */
        .orb-decoration { display: none !important; filter: none !important; }

        /* Stop all animations on mobile — transform animations create stacking contexts that swallow taps */
        .orb-decoration, .grain-overlay { animation: none !important; }
      }

      @media (max-width: 380px) {
        .landing-hero-title { font-size: 26px !important; }
        .app-shell { padding: 16px 12px 100px !important; }
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
    <div className="grain-overlay" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200 }} aria-hidden="true">
      <svg style={{ width: "100%", height: "100%", opacity: 0.038, pointerEvents: "none", display: "block" }}>
        <filter id="mx-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mx-grain)" style={{ pointerEvents: "none" }} />
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
  const [journal, setJournal]           = useState([]);

  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setNeedsPasswordReset(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setGoals([]); setProfile(null); setStreak(null); setMotivation(null); setJournal([]); return; }
    fetchProfile();
    fetchGoals();
    doCheckin();
    fetchMotivation();
    fetchCheckinHistory();
    fetchJournal();
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
  async function fetchJournal() {
    const { ok, data } = await api("/journal", { token: session?.access_token });
    if (ok && Array.isArray(data)) setJournal(data);
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
  if (needsPasswordReset) return <><GlobalStyles /><GrainOverlay /><ResetPasswordPage onDone={() => setNeedsPasswordReset(false)} /></>;

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
      <div className="app-shell" style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px", minHeight: "100vh" }}>

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
            journal={journal} onJournalUpdate={fetchJournal}
            onNewGoal={() => setPage("create")}
            onSelectGoal={g => { setSelectedGoal(g); setPage("plan"); }}
            onDeleteGoal={handleDeleteGoal}
            onUpgrade={() => setShowUpgrade(true)}
            userEmail={session?.user?.email}
            token={session?.access_token}
            onPlanChange={fetchProfile}
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
            onProfileUpdate={(updated) => setProfile(updated)}
          />
        )}
        {page === "privacy" && <PrivacyPage onBack={() => setPage("profile")} />}
        {page === "terms"   && <TermsPage   onBack={() => setPage("profile")} />}

        {showUpgrade && (
          <UpgradeModal session={session} currentPlan={profile?.plan} onClose={() => setShowUpgrade(false)} />
        )}
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: "rgba(8,13,26,0.97)",
        borderTop: `1px solid rgba(0,212,255,0.12)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }} className="mobile-bottom-nav">
        {[
          { icon: "🏠", label: "Home", pg: "dashboard" },
          { icon: "＋", label: "New Goal", pg: "create" },
          { icon: "👤", label: "Profile", pg: "profile" },
        ].map(({ icon, label, pg }) => {
          const active = page === pg;
          return (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                color: active ? C.cyan : C.textMuted,
              }}
            >
              <span style={{ fontSize: pg === "create" ? 22 : 18, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.04em" }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

// ── Onboarding Quiz ────────────────────────────────────────────────────────────
const QUIZ_STEPS = [
  {
    id: "display_name",
    question: "What should we call you?",
    sub: "Just a name — doesn't have to be your real name. This is what shows up in your dashboard.",
    type: "text",
    placeholder: "e.g. Alex, Coach, The Boss...",
  },
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
  const [textInput, setTextInput] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const current = QUIZ_STEPS[step];
  const progress = ((step) / QUIZ_STEPS.length) * 100;

  async function finishQuiz(finalAnswers) {
    setSaving(true);
    setError(null);
    const { ok, data } = await api("/profile/onboarding", {
      method: "PATCH",
      token: session.access_token,
      body: {
        display_name: finalAnswers.display_name,
        goal_type: finalAnswers.goal_type,
        daily_time: finalAnswers.daily_time,
        biggest_challenge: finalAnswers.biggest_challenge,
        motivation: finalAnswers.motivation,
      },
    });
    setSaving(false);
    if (!ok) {
      setError(data?.error || "Failed to save. Please try again.");
      return;
    }
    onComplete();
  }

  async function selectOption(value) {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      // Brief delay for selection feel, then advance
      setTimeout(() => setStep(s => s + 1), 220);
    } else {
      await finishQuiz(newAnswers);
    }
  }

  async function submitText() {
    const val = textInput.trim();
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);
    setTextInput("");
    if (step < QUIZ_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      await finishQuiz(newAnswers);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
      {/* Ambient orbs */}
      <div className="orb-decoration" style={{ position: "fixed", top: "-10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07), transparent 65%)", animation: "orb-drift 18s ease-in-out infinite", pointerEvents: "none" }} />
      <div className="orb-decoration" style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.06), transparent 65%)", animation: "orb-drift 24s ease-in-out infinite reverse", pointerEvents: "none" }} />

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

          {/* Text input step */}
          {current.type === "text" ? (
            <div>
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && textInput.trim() && !saving && submitText()}
                placeholder={current.placeholder}
                maxLength={50}
                style={{
                  width: "100%", padding: "16px 20px", borderRadius: 12, fontSize: 18, fontWeight: 600,
                  background: C.bgCard, border: `1px solid ${C.cyanBorder}`, color: C.text,
                  outline: "none", marginBottom: 16,
                }}
              />
              <Btn
                onClick={submitText}
                disabled={!textInput.trim() || saving}
                loading={saving}
                style={{ width: "100%" }}
              >
                Continue →
              </Btn>
              <button
                onClick={() => { const na = { ...answers, [current.id]: "" }; setAnswers(na); setTextInput(""); setStep(s => s + 1); }}
                style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", marginTop: 12, display: "block", width: "100%", textAlign: "center" }}
              >
                Skip for now
              </button>
            </div>
          ) : (
          /* Options */
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
          )}

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
// ── Reset Password Page ────────────────────────────────────────────────────────
function ResetPasswordPage({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message || "Failed to update password.");
    else setDone(true);
    setLoading(false);
  }

  const inp = { width: "100%", padding: "13px 16px", border: `1px solid ${C.cyanBorder}`, borderRadius: 8, lineHeight: 1.5 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #00d4ff, #0090b8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "#07111f", fontWeight: 900 }}>MX</span>
          </div>
          <span className="grad-text" style={{ fontSize: 18, fontWeight: 900 }}>MomentumX</span>
        </div>

        <Card style={{ padding: 28 }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 10 }}>Password updated!</div>
              <p style={{ fontSize: 14, color: C.textSub, marginBottom: 24 }}>You're all set. Head back to your dashboard.</p>
              <Btn fullWidth onClick={onDone}>Go to Dashboard →</Btn>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 21, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: "-0.5px" }}>Set new password</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 26 }}>Choose a strong password for your account.</div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>New password</div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 8 characters" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Confirm password</div>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Same password again" style={inp} />
                </div>
                <Btn fullWidth loading={loading} size="lg"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f", border: "none", fontWeight: 800 }}>
                  Update Password →
                </Btn>
              </form>
              <ErrorBox msg={error} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

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
      if (error) setError("Incorrect email or password. Forgot your password?");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      });
      if (error) setError(error.message || "Failed to send reset email.");
      else setMessage("Check your inbox — we sent a password reset link.");
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
    { icon: "📓", label: "Progress journal" },
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
      num: "03", icon: "📓", color: C.purple,
      title: "Journal progress, get coached back",
      body: "Log what happened each day in your progress journal. The AI reads your note and tells you exactly what to do next — specific to your goals."
    },
    {
      num: "04", icon: "🔥", color: C.orange,
      title: "Build momentum that compounds",
      body: "Your streak, journal, and daily coaching all reinforce each other. Show up consistently and watch small actions turn into real results."
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
      <div className="orb-decoration" style={{ position: "fixed", top: "-15%", left: "-8%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.045), transparent 68%)", filter: "blur(80px)", pointerEvents: "none", animation: "orb-drift 18s ease-in-out infinite", zIndex: 0 }} />
      <div className="orb-decoration" style={{ position: "fixed", bottom: "-10%", right: "-12%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.04), transparent 68%)", filter: "blur(80px)", pointerEvents: "none", animation: "orb-drift 22s ease-in-out infinite reverse", zIndex: 0 }} />
      <div className="orb-decoration" style={{ position: "fixed", top: "60%", left: "35%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,232,122,0.02), transparent 68%)", filter: "blur(60px)", pointerEvents: "none", animation: "orb-drift 14s ease-in-out infinite 4s", zIndex: 0 }} />

      {/* Top accent line */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent 0%, #00d4ff 30%, #a855f7 70%, transparent 100%)", zIndex: 100, pointerEvents: "none" }} />

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner" style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #00d4ff, #0090b8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(0,212,255,0.35)" }}>
              <span style={{ fontSize: 10, color: "#07111f", fontWeight: 900 }}>MX</span>
            </div>
            <span className="grad-text" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.3px" }}>MomentumX</span>
          </div>
          <div className="landing-nav-links" style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
          {/* Mobile-only Sign In button — always visible in navbar */}
          <button
            className="landing-nav-signin-mobile"
            onClick={() => { setMode("login"); setTimeout(scrollToForm, 50); }}
            style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.cyanBorder}`, background: C.cyanDim, color: C.cyan, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "clamp(48px, 8vw, 88px) 20px 80px", position: "relative", zIndex: 1 }}>
        <div className="landing-hero">
          {/* Left column */}
          <div style={{ animation: "fade-up 0.45s ease" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(0,212,255,0.07)", border: `1px solid ${C.cyanBorder}`, borderRadius: 20, marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse-dot 2.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-POWERED GOAL COACHING</span>
            </div>

            {/* H1 */}
            <h1 className="landing-hero-title" style={{ fontSize: "clamp(36px, 6.5vw, 82px)", fontWeight: 900, lineHeight: 0.97, letterSpacing: "-2px", marginBottom: 26, color: C.text }}>
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
                  {mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset your password" : "Create your free account"}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  {mode === "login" ? "Sign in to continue" : mode === "forgot" ? "We'll email you a reset link" : "No credit card required · Free forever"}
                </div>
              </div>

              {mode !== "forgot" && (
                <div style={{ display: "flex", gap: 4, margin: "22px 0 24px", background: C.bgInput, borderRadius: 8, padding: 4 }}>
                  {["signup", "login"].map(m => (
                    <button key={m} className="tab"
                      onClick={() => { setMode(m); setError(null); setMessage(null); }}
                      style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 6, border: "none", background: mode === m ? C.cyanDim : "transparent", color: mode === m ? C.cyan : C.textSub, boxShadow: mode === m ? `0 0 0 1px ${C.cyanBorder}` : "none" }}>
                      {m === "signup" ? "Create Account" : "Sign In"}
                    </button>
                  ))}
                </div>
              )}
              {mode === "forgot" && <div style={{ marginTop: 22 }} />}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, letterSpacing: "0.03em" }}>Email</div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} />
                </div>
                {mode !== "forgot" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: "0.03em" }}>Password</div>
                      {mode === "login" && (
                        <button type="button" onClick={() => { setMode("forgot"); setError(null); setMessage(null); }}
                          style={{ background: "none", border: "none", color: C.cyan, fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 600 }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 8 characters" style={inp} />
                  </div>
                )}
                <Btn fullWidth loading={loading} size="lg"
                  style={{ marginTop: 4, background: "linear-gradient(135deg, #00d4ff, #00b5d8)", color: "#07111f", border: "none", fontSize: 15, fontWeight: 800, boxShadow: "0 0 28px rgba(0,212,255,0.3), 0 4px 16px rgba(0,0,0,0.4)" }}>
                  {mode === "login" ? "Sign In →" : mode === "forgot" ? "Send Reset Link →" : "Get Started Free →"}
                </Btn>
                {mode === "forgot" && (
                  <button type="button" onClick={() => { setMode("login"); setError(null); setMessage(null); }}
                    style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", padding: 0, textAlign: "center" }}>
                    ← Back to sign in
                  </button>
                )}
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

      {/* ── JOURNAL FEATURE CALLOUT ── */}
      <section className="landing-section" style={{ borderTop: `1px solid ${C.textDim}`, position: "relative", zIndex: 1, padding: "80px 24px" }}>
        <div className="landing-section-inner">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Left: copy */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>New Feature</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, color: C.text, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
                Your daily progress,<br />
                <span style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>coached by AI.</span>
              </h2>
              <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.8, margin: "0 0 28px" }}>
                Every day you log what happened — wins, blockers, anything. The AI reads your note, looks at your goals, and tells you exactly what to do next.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "📓", text: "Log progress in seconds — no templates, no structure required" },
                  { icon: "🤖", text: "AI reads your note and gives a specific next action, not generic advice" },
                  { icon: "📅", text: "Click any day on your calendar to see or edit your entry" },
                  { icon: "🟣", text: "Purple dots show your journaled days at a glance" },
                ].map(item => (
                  <div key={item.icon} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 16, lineHeight: 1.6 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setMode("signup"); setTimeout(scrollToForm, 50); }}
                className="btn"
                style={{
                  marginTop: 32, padding: "13px 28px", fontSize: 14, fontWeight: 800, borderRadius: 10,
                  background: "linear-gradient(135deg,#a855f7,#7c3aed)", border: "none", color: "#fff",
                  cursor: "pointer", boxShadow: "0 0 28px rgba(168,85,247,0.3)",
                }}
              >
                Try it free →
              </button>
            </div>

            {/* Right: mock journal card */}
            <div style={{
              background: C.bgCard, border: `1px solid rgba(168,85,247,0.25)`, borderRadius: 14,
              padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(168,85,247,0.08)",
            }}>
              {/* Mini calendar header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "rgba(168,85,247,0.08)", border: `1px solid rgba(168,85,247,0.2)`, borderRadius: 8 }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Daily Progress Journal</span>
                <span style={{ fontSize: 11, color: C.textSub, marginLeft: "auto" }}>86% consistent · 5 entries</span>
              </div>
              {/* Day entry */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Thursday, June 18</div>
                <div style={{ fontSize: 11, color: C.cyan, marginBottom: 10 }}>✓ Checked in · Has journal entry</div>
                <div style={{ background: C.bgInput, border: `1px solid ${C.cyanBorder}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
                  "Finished writing the sales page draft. Got two people to review it. Need to finalize pricing section and add testimonials."
                </div>
              </div>
              {/* AI coaching */}
              <div style={{ padding: "12px 14px", background: "rgba(0,212,255,0.06)", border: `1px solid ${C.cyanBorder}`, borderLeft: `3px solid ${C.cyan}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>🤖 AI Coaching — What To Do Next</div>
                <p style={{ fontSize: 12, color: C.text, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                  "Your sales page draft is 80% done — the pricing section is the highest-leverage piece left. Spend the next 60 minutes writing two pricing options: a single-pay and a monthly plan. Anchoring a higher tier first typically increases conversions by 20–35%."
                </p>
              </div>
            </div>
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

          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, maxWidth: 920, margin: "0 auto" }}>
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
function SmartCalendar({ checkinHistory, journal, plan, onUpgrade, token, onJournalUpdate }) {
  const isPro = plan === "pro" || plan === "growth";
  const days = isPro ? 30 : 7;
  const journalLimit = isPro ? Infinity : 3;
  const journalCount = journal?.length ?? 0;
  const journalAtLimit = !isPro && journalCount >= journalLimit;
  const today = new Date().toISOString().slice(0, 10);

  const [open, setOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(null); // { key, label, checked, hasNote }
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null); // { note, ai_suggestion }

  const checkedSet = new Set([...checkinHistory, today]);

  // Build journal map for quick lookup
  const journalMap = {};
  for (const e of journal) journalMap[e.entry_date] = e;

  // Build slots
  const slots = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    slots.push({ key, label, dayNum, checked: checkedSet.has(key), isToday: i === 0, hasNote: !!journalMap[key] });
  }

  const doneCount = slots.filter(s => s.checked).length;
  const pct = Math.round((doneCount / days) * 100);
  const pctColor = pct >= 80 ? C.green : pct >= 50 ? C.cyan : C.orange;
  const noteCount = slots.filter(s => s.hasNote).length;

  function openDay(slot) {
    setActiveDay(slot);
    const existing = journalMap[slot.key];
    setNoteText(existing?.note ?? "");
    setSavedEntry(existing ?? null);
  }

  function closeDay() { setActiveDay(null); setNoteText(""); setSavedEntry(null); }

  async function saveNote() {
    if (!noteText.trim() || !token) return;
    setSaving(true);
    try {
      const { ok, data } = await api(`/journal/${activeDay.key}`, {
        method: "POST", token, body: { note: noteText.trim() },
      });
      if (ok) {
        setSavedEntry(data);
        onJournalUpdate();
      }
    } finally {
      setSaving(false);
    }
  }

  const gridCols = isPro ? "repeat(10, 1fr)" : "repeat(7, 1fr)";

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ── Collapsed header — always visible ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn"
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "11px 16px", borderRadius: open ? "10px 10px 0 0" : 10,
          background: open ? C.bgCard : "rgba(0,212,255,0.04)",
          border: `1px solid ${open ? C.cyanBorder : C.textDim}`,
          borderBottom: open ? `1px solid ${C.textDim}` : undefined,
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 16 }}>📅</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Daily Progress Journal</span>
          <span style={{ fontSize: 11, color: C.textSub, marginLeft: 10 }}>
            {pct}% consistent · {noteCount} {noteCount === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mini dot strip preview */}
          {!open && slots.slice(-7).map(s => (
            <div key={s.key} style={{
              width: 7, height: 7, borderRadius: 2,
              background: s.checked ? C.cyan : s.hasNote ? C.purple : C.textDim,
              opacity: s.isToday ? 1 : 0.7,
            }} />
          ))}
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* ── Expanded calendar ── */}
      {open && (
        <div style={{
          border: `1px solid ${C.textDim}`, borderTop: "none",
          borderRadius: "0 0 10px 10px",
          background: C.bgCard, padding: "16px 16px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: C.textSub }}>
              Click any day to log progress or get AI coaching
            </span>
            {!isPro && (
              <button onClick={onUpgrade} style={{ background: "none", border: "none", fontSize: 11, color: C.gold, cursor: "pointer", fontWeight: 700 }}>
                View 30 days ✦
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isPro ? 5 : 8 }}>
            {slots.map(s => (
              <button
                key={s.key}
                onClick={() => openDay(s)}
                title={s.key}
                className="btn"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: isPro ? "5px 2px" : "7px 4px",
                  borderRadius: 7, cursor: "pointer",
                  background: activeDay?.key === s.key ? "rgba(0,212,255,0.12)"
                    : s.hasNote ? "rgba(168,85,247,0.08)"
                    : s.checked ? "rgba(0,212,255,0.06)" : "transparent",
                  border: `1px solid ${
                    activeDay?.key === s.key ? C.cyan
                    : s.hasNote ? "rgba(168,85,247,0.35)"
                    : s.isToday ? C.cyanBorder
                    : s.checked ? "rgba(0,212,255,0.15)" : C.textDim}`,
                  transition: "all 0.12s",
                }}
              >
                {/* Dot */}
                <div style={{
                  width: isPro ? 10 : 14, height: isPro ? 10 : 14, borderRadius: 3,
                  background: s.hasNote ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                    : s.checked ? "linear-gradient(135deg, #00d4ff, #00b5d8)" : C.bgInput,
                  boxShadow: s.hasNote ? "0 0 6px rgba(168,85,247,0.4)"
                    : s.checked ? "0 0 5px rgba(0,212,255,0.3)" : "none",
                  flexShrink: 0,
                }} />
                {!isPro && <span style={{ fontSize: 9, color: s.isToday ? C.cyan : C.textMuted, fontWeight: s.isToday ? 700 : 400 }}>{s.label.slice(0,1)}</span>}
                {isPro && <span style={{ fontSize: 8, color: C.textMuted }}>{s.dayNum}</span>}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[
              { color: "linear-gradient(135deg,#00d4ff,#00b5d8)", label: "Checked in" },
              { color: "linear-gradient(135deg,#a855f7,#7c3aed)", label: "Has journal entry" },
              { color: C.bgInput, border: C.textDim, label: "Missed" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, border: l.border ? `1px solid ${l.border}` : "none" }} />
                <span style={{ fontSize: 10, color: C.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day detail drawer ── */}
      {activeDay && (
        <div style={{
          marginTop: 8, padding: "18px 20px",
          background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(0,212,255,0.04))",
          border: `1px solid rgba(168,85,247,0.2)`,
          borderRadius: 10, animation: "fade-up 0.15s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                {new Date(activeDay.key + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ fontSize: 11, color: activeDay.checked ? C.cyan : C.textMuted, marginTop: 2 }}>
                {activeDay.checked ? "✓ Checked in" : "No check-in this day"}
                {activeDay.hasNote && <span style={{ color: C.purple, marginLeft: 8 }}>· Has journal entry</span>}
              </div>
            </div>
            <button onClick={closeDay} className="btn" style={{ background: "none", border: "none", color: C.textMuted, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</button>
          </div>

          {/* Note input — gated for free users after 3 entries */}
          {journalAtLimit && !activeDay.hasNote ? (
            <div style={{ marginBottom: 14, padding: "16px 18px", background: "rgba(255,201,71,0.06)", border: `1px solid ${C.goldBorder}`, borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>📓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 4 }}>Journal limit reached</div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 14, lineHeight: 1.6 }}>
                Free plan includes 3 journal entries. Upgrade to Pro for unlimited journaling with AI coaching.
              </div>
              <Btn onClick={onUpgrade} variant="primary" style={{ background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", fontWeight: 800 }}>
                Upgrade to Pro — $9.99/mo
              </Btn>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                What happened? {!isPro && <span style={{ color: C.textMuted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({journalLimit - journalCount} of {journalLimit} entries remaining)</span>}
              </div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log your progress, wins, blockers, or anything that happened toward your goals…"
                maxLength={1000}
                rows={3}
                style={{
                  width: "100%", background: C.bgInput, border: `1px solid ${C.cyanBorder}`,
                  borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13,
                  lineHeight: 1.6, resize: "vertical", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: C.textMuted }}>{noteText.length}/1000</span>
                <button
                  onClick={saveNote}
                  disabled={!noteText.trim() || saving}
                  className="btn"
                  style={{
                    padding: "7px 18px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    background: noteText.trim() ? "linear-gradient(135deg,#a855f7,#7c3aed)" : C.bgInput,
                    border: "none", color: noteText.trim() ? "#fff" : C.textMuted,
                    cursor: noteText.trim() ? "pointer" : "default",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving…" : savedEntry?.note ? "Update & Re-coach" : "Save & Get Coaching"}
                </button>
              </div>
            </div>
          )}

          {/* AI coaching suggestion */}
          {savedEntry?.ai_suggestion && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(0,212,255,0.06)",
              border: `1px solid ${C.cyanBorder}`,
              borderLeft: `3px solid ${C.cyan}`,
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                🤖 AI Coaching — What To Do Next
              </div>
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                "{savedEntry.ai_suggestion}"
              </p>
            </div>
          )}

          {!savedEntry && (
            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>
              Log what happened and get a personalized AI coaching tip for what to do next.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ADMIN_EMAIL = "huntercmathiesen@gmail.com";

function Dashboard({ goals, loading, profile, streak, motivation, checkinHistory, journal, onJournalUpdate, onNewGoal, onSelectGoal, onDeleteGoal, onUpgrade, userEmail, token, onPlanChange }) {
  const isAtLimit = profile?.plan === "free" && goals.length >= 1;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const [testerLoading, setTesterLoading] = useState(null);
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

  async function switchPlan(plan) {
    setTesterLoading(plan);
    try {
      await api("/admin/set-plan", { method: "POST", token, body: { plan } });
      await onPlanChange();
    } catch (e) {
      console.error("Plan switch failed:", e);
    } finally {
      setTesterLoading(null);
    }
  }

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* ── Tester panel (admin only) ── */}
      {isAdmin && (
        <div style={{
          marginBottom: 20, padding: "12px 18px",
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.25)",
          borderRadius: 10,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: "0.1em", textTransform: "uppercase" }}>🧪 Tester Mode</span>
          <span style={{ fontSize: 12, color: C.textSub }}>Active plan: <strong style={{ color: C.text }}>{profile?.plan ?? "free"}</strong></span>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {["free", "pro", "growth"].map(p => (
              <button
                key={p}
                onClick={() => switchPlan(p)}
                disabled={testerLoading !== null || profile?.plan === p}
                className="btn"
                style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 7,
                  background: profile?.plan === p ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.1)",
                  border: `1px solid ${profile?.plan === p ? C.purple : "rgba(168,85,247,0.3)"}`,
                  color: profile?.plan === p ? C.purple : C.textSub,
                  cursor: profile?.plan === p ? "default" : "pointer",
                  textTransform: "capitalize",
                  opacity: testerLoading === p ? 0.5 : 1,
                }}
              >
                {testerLoading === p ? "..." : p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Header: greeting + streak + new goal ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", color: C.text, margin: 0 }}>
            {greeting}{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, marginTop: 5, letterSpacing: "0.02em" }}>{dateStr}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {currentStreak > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 20,
              background: "rgba(255,201,71,0.09)", border: `1px solid ${C.goldBorder}`,
            }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: flameColor }}>{currentStreak}</span>
              <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600 }}>day</span>
            </div>
          )}
          <Btn onClick={isAtLimit ? onUpgrade : onNewGoal} variant={isAtLimit ? "orange" : "primary"}
            style={!isAtLimit ? { background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", fontWeight: 800, boxShadow: "0 0 20px rgba(0,212,255,0.25)" } : {}}>
            {isAtLimit ? "Upgrade →" : "+ New Goal"}
          </Btn>
        </div>
      </div>

      {/* ── Goals — PRIMARY content ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Spinner size={24} />
          <span style={{ fontSize: 14, color: C.textMuted }}>Loading your goals...</span>
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(168,85,247,0.12), rgba(0,212,255,0.06))", borderRadius: 14, padding: 1, boxShadow: "0 4px 32px rgba(0,0,0,0.4)", marginBottom: 28 }}>
          <div style={{ background: C.bgCard, borderRadius: 13, textAlign: "center", padding: "56px 32px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, opacity: 0.8 }}>Get Started</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 10, letterSpacing: "-0.5px" }}>What's your goal?</h2>
            <p style={{ fontSize: 15, color: C.textSub, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 28px" }}>
              Tell the AI your goal and get a personalized action plan with daily coaching — in under a minute.
            </p>
            <Btn onClick={onNewGoal} size="lg" style={{ background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", boxShadow: "0 0 28px rgba(0,212,255,0.28)" }}>
              Create My First Goal →
            </Btn>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onClick={() => onSelectGoal(goal)} onDelete={() => onDeleteGoal(goal.id)} />
          ))}
        </div>
      )}

      {/* ── Free plan nudge ── */}
      {!loading && profile?.plan === "free" && goals.length >= 1 && (
        <div style={{ marginBottom: 28, padding: "14px 18px", background: C.orangeDim, border: `1px solid ${C.orangeBorder}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 2 }}>Free plan — 1 goal limit</div>
            <div style={{ fontSize: 13, color: C.textSub }}>Upgrade to track multiple goals and unlock unlimited AI coaching.</div>
          </div>
          <Btn onClick={onUpgrade} variant="orange" size="sm" style={{ flexShrink: 0 }}>Upgrade →</Btn>
        </div>
      )}

      {/* ── AI Daily Briefing (Pro+) ── */}
      {goals.length > 0 && (
        <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.cyanBorder}`, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(0,212,255,0.05)", borderBottom: `1px solid ${C.cyanBorder}` }}>
            <span style={{ fontSize: 12 }}>🤖</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: "0.12em", textTransform: "uppercase" }}>AI Coach — Daily Briefing</span>
            {!isPro && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: C.gold, background: "rgba(255,201,71,0.1)", border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: "2px 8px" }}>Pro</span>}
          </div>
          {isPro && motivation ? (
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12, background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(168,85,247,0.02))" }}>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>"{motivation}"</p>
              {(() => {
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                const yesterdayEntry = (journal ?? []).find(e => e.entry_date === yesterday);
                return yesterdayEntry ? (
                  <div style={{ padding: "9px 13px", background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)", borderLeft: `3px solid ${C.purple}`, borderRadius: 7 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>📓 Yesterday</div>
                    <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, margin: 0 }}>"{yesterdayEntry.note.length > 140 ? yesterdayEntry.note.slice(0, 140) + "…" : yesterdayEntry.note}"</p>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div style={{ padding: "18px 20px", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: C.textMuted, fontStyle: "italic", margin: "0 0 8px", filter: "blur(4px)", userSelect: "none" }}>
                  "Great progress yesterday. Today focus on staying consistent with your plan. You're closer than you think..."
                </p>
                <p style={{ fontSize: 13, color: C.textSub, margin: 0 }}>Get a personalized AI message every morning based on your goals and journal.</p>
              </div>
              <Btn onClick={onUpgrade} variant="primary" style={{ flexShrink: 0, fontSize: 12, padding: "8px 14px", background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", fontWeight: 800 }}>
                Unlock
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {/* Progress — always visible */}
        <div style={{ background: "linear-gradient(135deg, rgba(0,232,122,0.08), rgba(0,232,122,0.02))", border: `1px solid ${C.greenBorder}`, borderRadius: 12, padding: "18px 16px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.green, lineHeight: 1, letterSpacing: "-1px", marginBottom: 6 }}>{avgProgress}%</div>
          <div style={{ fontSize: 11, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Avg. Progress</div>
        </div>
        {/* Streak — locked for free */}
        <div
          onClick={!isPro ? onUpgrade : undefined}
          style={{ background: "linear-gradient(135deg, rgba(255,201,71,0.08), rgba(255,201,71,0.02))", border: `1px solid ${C.goldBorder}`, borderRadius: 12, padding: "18px 16px", position: "relative", cursor: !isPro ? "pointer" : "default", overflow: "hidden" }}>
          {!isPro && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(7,17,31,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 12 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>Pro feature</span>
            </div>
          )}
          <div style={{ fontSize: 36, fontWeight: 900, color: flameColor, lineHeight: 1, letterSpacing: "-1px", marginBottom: 6 }}>
            {isPro ? (currentStreak || "0") : "?"}
          </div>
          <div style={{ fontSize: 11, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>🔥 Day Streak</div>
        </div>
      </div>

      {/* ── Longest streak (Pro+) ── */}
      {isPro && longestStreak > 0 && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 8 }}>
          <span style={{ fontSize: 16 }}>🏆</span>
          <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>Personal best: {longestStreak}-day streak</span>
          {isGrowth && currentStreak > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: C.purple, fontWeight: 700, background: C.purpleDim, border: `1px solid ${C.purpleBorder}`, padding: "2px 8px", borderRadius: 10 }}>
              ❄️ Streak freeze
            </span>
          )}
        </div>
      )}

      {/* ── Daily Progress Journal ── */}
      <SmartCalendar
        checkinHistory={checkinHistory ?? []}
        journal={journal ?? []}
        plan={profile?.plan ?? "free"}
        onUpgrade={onUpgrade}
        token={token}
        onJournalUpdate={onJournalUpdate}
      />
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, onClick, onDelete }) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysAdvice = goal.daily_advice?.find(a => a.advice_date === today)?.advice;

  let progress = 0, doneCount = 0, completedSteps = [];
  const steps = goal.plan?.steps ?? [];
  const totalSteps = steps.length;
  try {
    completedSteps = JSON.parse(localStorage.getItem(`mx_steps_${goal.id}`) || "[]");
    doneCount = completedSteps.length;
    progress  = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  } catch {}

  // Find the next step the user hasn't done yet
  const nextStep = steps.find((_, i) => !completedSteps.includes(i));

  return (
    <div className="card-hover" onClick={onClick} style={{
      background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.12), rgba(0,212,255,0.06))",
      borderRadius: 14, padding: 1, cursor: "pointer",
      boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      transition: "box-shadow 0.2s ease, transform 0.15s ease",
    }}>
    <div style={{ background: C.bgCard, borderRadius: 13, padding: "20px 22px" }}>

      {/* Goal title + delete */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, lineHeight: 1.45, flex: 1 }}>{goal.goal_text}</div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, lineHeight: 1, padding: "2px 5px", flexShrink: 0, borderRadius: 4, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.color = C.red}
          onMouseLeave={e => e.target.style.color = C.textMuted}>
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.textSub }}>{doneCount} of {totalSteps} steps done</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: progress === 100 ? C.green : C.cyan }}>{progress}%</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: progress === 100 ? C.green : `linear-gradient(90deg, #00b0d8, ${C.cyan})`,
            borderRadius: 6, transition: "width 0.5s ease",
            boxShadow: progress > 0 ? `0 0 8px rgba(0,212,255,0.4)` : "none",
          }} />
        </div>
      </div>

      {/* Next step hint */}
      {nextStep && progress < 100 && (
        <div style={{
          padding: "9px 13px", borderRadius: 8,
          background: "rgba(0,212,255,0.05)",
          border: `1px solid ${C.cyanBorder}`,
          marginBottom: todaysAdvice ? 10 : 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
            ▶ Next up
          </span>
          <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.55 }}>
            {typeof nextStep === "string" ? nextStep : nextStep.title ?? nextStep.text ?? "Continue your plan"}
          </span>
        </div>
      )}

      {/* Today's coaching */}
      {todaysAdvice && (
        <div style={{
          padding: "9px 13px", borderRadius: 8,
          background: "rgba(0,232,122,0.05)",
          borderLeft: `3px solid ${C.green}`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 4 }}>
            Today's Coaching
          </span>
          <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>{todaysAdvice}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <span style={{ fontSize: 13, color: C.cyan, fontWeight: 600 }}>View full plan →</span>
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeen, setCelebrationSeen] = useState(() => {
    try { return localStorage.getItem(`mx_celebrated_${goal.id}`) === "1"; }
    catch { return false; }
  });

  const plan       = goal.plan;
  const totalSteps = plan?.steps?.length ?? 0;
  const doneCount  = completedSteps.length;
  const progress   = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  // Fire celebration when all steps are checked for first time
  React.useEffect(() => {
    if (totalSteps > 0 && doneCount === totalSteps && !celebrationSeen) {
      setShowCelebration(true);
      setCelebrationSeen(true);
      try { localStorage.setItem(`mx_celebrated_${goal.id}`, "1"); } catch {}
    }
  }, [doneCount, totalSteps, celebrationSeen]);

  function toggleStep(i) {
    setCompletedSteps(prev => {
      const next = prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i];
      localStorage.setItem(`mx_steps_${goal.id}`, JSON.stringify(next));
      return next;
    });
  }

  function buildShareText() {
    return encodeURIComponent(`🎯 I just completed my goal: "${goal.goal_text}" with MomentumX! Building momentum that compounds 🚀`);
  }

  const TABS = [
    { id: "plan",  label: "Action Plan" },
    { id: "brief", label: "Daily Brief" },
    { id: "chat",  label: "Ask AI"      },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease" }}>

      {/* ── Goal Completion Ceremony Modal ── */}
      {showCelebration && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, animation: "fade-up 0.3s ease",
        }}>
          {/* Confetti dots */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 8, height: 8, borderRadius: "50%",
                background: ["#00d4ff","#a855f7","#22c55e","#f59e0b","#ec4899"][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.7,
                animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s both`,
              }} />
            ))}
          </div>

          <div className="modal-inner" style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "36px 28px", maxWidth: 420, width: "100%",
            textAlign: "center", position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(34,197,94,0.12)",
          }}>
            {/* Close */}
            <button onClick={() => setShowCelebration(false)}
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
              ✕
            </button>

            <div style={{ fontSize: 52, marginBottom: 16 }}>🏆</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>
              Goal Complete!
            </h2>
            <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, margin: "0 0 6px" }}>
              You completed every step of:
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.cyan, lineHeight: 1.5, margin: "0 0 28px", fontStyle: "italic" }}>
              "{goal.goal_text}"
            </p>

            {/* Share buttons */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                Share your win
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {/* Twitter/X */}
                <a href={`https://twitter.com/intent/tweet?text=${buildShareText()}&url=https://momentumx.app`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9,
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
                    color: C.text, fontSize: 13, fontWeight: 600, textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}>
                  𝕏 Twitter
                </a>
                {/* LinkedIn */}
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://momentumx.app`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9,
                    background: "rgba(10,102,194,0.2)", border: "1px solid rgba(10,102,194,0.4)",
                    color: C.text, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                  in LinkedIn
                </a>
                {/* WhatsApp */}
                <a href={`https://wa.me/?text=${buildShareText()}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9,
                    background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)",
                    color: C.text, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                  💬 WhatsApp
                </a>
                {/* Copy text */}
                <button onClick={() => {
                  navigator.clipboard?.writeText(`🎯 I just completed my goal: "${goal.goal_text}" with MomentumX! Building momentum that compounds 🚀 https://momentumx.app`);
                }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 9,
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Set next goal CTA */}
            <Btn onClick={() => { setShowCelebration(false); onBack(); }} style={{ width: "100%" }}>
              🎯 Set My Next Goal
            </Btn>
          </div>
        </div>
      )}

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
      id: "pro", label: "Pro", price: "$9.99", wasPrice: "$14.99", period: "/mo",
      accent: C.cyan, variant: "primary", badge: "Most Popular",
      highlight: true,
      features: [
        { text: "3 active goals", included: true },
        { text: "Daily AI briefing & coaching", included: true },
        { text: "Unlimited journal entries", included: true },
        { text: "30-day history & progress graphs", included: true },
        { text: "Full streak tracking", included: true },
        { text: "Detailed action plans", included: true },
      ],
    },
    {
      id: "growth", label: "Growth", price: "$19.99", wasPrice: "$29.99", period: "/mo",
      accent: C.purple, variant: "purple", badge: "Best Value",
      highlight: false,
      features: [
        { text: "Unlimited goals", included: true },
        { text: "Everything in Pro", included: true },
        { text: "Priority AI responses", included: true },
        { text: "Streak freeze protection", included: true },
        { text: "Early access to new features", included: true },
        { text: "Export your data", included: true },
      ],
    },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: C.bgOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 540, animation: "fade-up 0.3s ease", padding: "20px 0" }}>
        <Card>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 22, borderRadius: 4, lineHeight: 1 }}>×</button>

          {/* Early adopter banner */}
          <div style={{ margin: "-4px -4px 22px", padding: "10px 18px", background: "linear-gradient(90deg, rgba(255,201,71,0.12), rgba(255,140,0,0.08))", border: `1px solid ${C.goldBorder}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15 }}>🎉</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>Early Adopter Pricing — Limited Time</span>
              <span style={{ fontSize: 12, color: C.textSub, display: "block", marginTop: 1 }}>Lock in these rates before we raise prices. Cancel anytime.</span>
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 6 }}>Unlock the Full Experience</h2>
          <p style={{ fontSize: 14, color: C.textSub, marginBottom: 24, lineHeight: 1.6 }}>
            Free gets you started. Pro keeps you going.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{
                border: `1px solid ${plan.highlight ? plan.accent : plan.accent + "44"}`,
                borderRadius: 12,
                padding: "18px 20px",
                background: plan.highlight ? `${plan.accent}08` : `${plan.accent}04`,
                boxShadow: plan.highlight ? `0 0 24px ${plan.accent}15` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: plan.accent }}>{plan.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: plan.accent, background: `${plan.accent}18`, border: `1px solid ${plan.accent}40`, borderRadius: 20, padding: "2px 9px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {plan.badge}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1 }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: C.textSub }}>{plan.period}</span>
                      <span style={{ fontSize: 12, color: C.textMuted, textDecoration: "line-through" }}>was {plan.wasPrice}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {plan.features.map(f => (
                        <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: plan.accent, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: C.textSub }}>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Btn
                    onClick={() => handleUpgrade(plan.id)}
                    loading={loading === plan.id}
                    disabled={currentPlan === plan.id}
                    variant={plan.variant}
                    style={{ flexShrink: 0, marginTop: 4, ...(plan.highlight ? { background: "linear-gradient(135deg, #00d4ff, #00b5d8)", border: "none", color: "#07111f", fontWeight: 800, boxShadow: "0 0 20px rgba(0,212,255,0.3)" } : {}) }}>
                    {currentPlan === plan.id ? "Current" : "Get Started"}
                  </Btn>
                </div>
              </div>
            ))}
          </div>

          {/* Free tier comparison */}
          <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Free plan includes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { text: "1 goal", ok: true },
                { text: "AI-generated action plan", ok: true },
                { text: "3 journal entries", ok: true },
                { text: "7-day check-in history", ok: true },
                { text: "Daily AI briefing", ok: false },
                { text: "Streak tracking", ok: false },
                { text: "Progress graphs", ok: false },
              ].map(f => (
                <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: f.ok ? C.green : C.textDim, fontWeight: 700, flexShrink: 0 }}>{f.ok ? "✓" : "✕"}</span>
                  <span style={{ fontSize: 13, color: f.ok ? C.textSub : C.textMuted }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 18 }}>
            Secured by Stripe · Cancel anytime · No hidden fees
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────────
function ProfilePage({ session, profile, onBack, onLogout, onNavigate, onProfileUpdate }) {
  const [copiedRef, setCopiedRef]   = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg]           = useState(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [openFaq, setOpenFaq]       = useState(null);
  const [displayName, setDisplayName]     = useState(profile?.display_name || "");
  const [savingName, setSavingName]       = useState(false);
  const [nameMsg, setNameMsg]             = useState(null);

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

  async function saveDisplayName() {
    if (!displayName.trim()) return;
    setSavingName(true);
    setNameMsg(null);
    const { ok } = await api("/profile/display-name", {
      method: "PATCH",
      token: session.access_token,
      body: { display_name: displayName.trim() },
    });
    setSavingName(false);
    if (ok) {
      setNameMsg("Name updated!");
      if (onProfileUpdate) onProfileUpdate({ ...profile, display_name: displayName.trim() });
    } else {
      setNameMsg("Failed to save. Try again.");
    }
    setTimeout(() => setNameMsg(null), 3000);
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

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Display Name</div>
          <div style={{ fontSize: 13, color: C.textSub, marginBottom: 10 }}>Shown in your dashboard greeting. Doesn't have to be your real name.</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDisplayName()}
              placeholder="e.g. Alex, Coach, The Boss..."
              maxLength={50}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 14,
                background: C.bgInput, border: `1px solid ${C.cyanBorder}`, color: C.text,
              }}
            />
            <Btn onClick={saveDisplayName} loading={savingName} size="sm" disabled={!displayName.trim() || displayName.trim() === profile?.display_name}>
              Save
            </Btn>
          </div>
          {nameMsg && (
            <div style={{ marginTop: 8, fontSize: 13, color: nameMsg.includes("updated") ? C.green : C.red }}>
              {nameMsg}
            </div>
          )}
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
