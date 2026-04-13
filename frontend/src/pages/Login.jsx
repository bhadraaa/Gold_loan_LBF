import { useState, useEffect } from "react";
import api from "../axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/gl.css";

/* ─── Feature Lists ─── */
const staffFeatures = [
  {
    label: "Loan Management",
    desc: "Create, track & close loans",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Gold Custody",
    desc: "Record items & weights",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,2 16,6 16,12 9,16 2,12 2,6" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Branch Reports",
    desc: "Daily summaries & analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 14l3.5-4 3 2.5 3-5 2.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

const ownerFeatures = [
  {
    label: "All Branch Overview",
    desc: "Monitor every branch at once",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Activity Logs",
    desc: "Track every staff action",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 9h3l2-5 3 10 2-6 2 3 2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Gold Rate Settings",
    desc: "Set & update gold rates",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,1.5 11,6.5 16.5,7 12.5,11 13.5,16.5 9,14 4.5,16.5 5.5,11 1.5,7 7,6.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </svg>
    ),
  },
];

/* ─── Icon Components ─── */
const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M1.5 9s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M1.5 9s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="2.5" y="5.5" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
    <path d="M4.5 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);
const BackArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PersonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="4.5" r="2.3" stroke="currentColor" strokeWidth="1.1" />
    <path d="M1.5 12c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);
const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <polygon points="6.5,1.5 8,5 12,5.5 9,8.5 10,12 6.5,10.2 3,12 4,8.5 1,5.5 5,5" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);
const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" fill="none" stroke="#fff" strokeWidth="1.6" />
    <circle cx="11" cy="11" r="3" fill="#fff" />
  </svg>
);
const AlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* ─── Main Component ─── */
export default function Login() {
  const { role } = useParams();       // "staff" | "owner"
  const isOwner = role === "owner";

  const [username, setUsername] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ── Redirect if already logged in ── */
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const r = sessionStorage.getItem("role");
    if (token && r) navigate(`/${r}`, { replace: true });
  }, [navigate]);

  /* ── Load branches for staff ── */
  useEffect(() => {
    if (!isOwner) {
      api.get("/api/branches")
        .then(res => setBranches(res.data))
        .catch(() => setBranches([]));
    }
  }, [isOwner]);

  const canSubmit = isOwner
    ? Boolean(username && password)
    : Boolean(username && password && branch);

  /* ── Login handler (original logic preserved exactly) ── */
  const handleLogin = async () => {
    if (!canSubmit) {
      setError(isOwner ? "Enter username and password." : "Please fill all fields.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const body = isOwner
        ? { name: username, password }
        : { name: username, password, branch_id: branch };

      const res = await api.post("/api/auth/login", body);
      const token = res.data.token;
      sessionStorage.setItem("token", token);

      const callingName =
        res.data?.calling_name ||
        res.data?.staff_name ||
        res.data?.name ||
        username ||
        "User";

      sessionStorage.setItem("calling_name", callingName);
      const payload = JSON.parse(atob(token.split(".")[1]));
      sessionStorage.setItem("role", payload.role);
      sessionStorage.setItem("name", username);

      if (!isOwner) {
        const branchName = branches.find(b => b.id === Number(branch))?.name;
        if (branchName) sessionStorage.setItem("branch", branchName);
      }

      navigate(`/${payload.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  /* ─── Styles ─── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Cormorant+Garamond:wght@600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

    .lr {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      font-family: 'DM Sans', sans-serif;
      background: #0E0808;
    }

    /* ══ LEFT PANEL ══ */
    .lr-left {
      width: 420px;
      flex-shrink: 0;
      background: #100A0A;
      display: flex;
      flex-direction: column;
      padding: 44px 40px 36px;
      position: relative;
      overflow: hidden;
    }
    .lr-left::before {
      content: '';
      position: absolute;
      top: -80px; left: -80px;
      width: 320px; height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(139,0,0,.28) 0%, transparent 70%);
      pointer-events: none;
    }
    .lr-left::after {
      content: '';
      position: absolute;
      bottom: -60px; right: -60px;
      width: 240px; height: 240px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,175,55,.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .lr-left-accent {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #D4AF37 40%, #8B0000 100%);
    }

    /* Brand */
    .lr-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }
    .lr-logo {
      width: 44px; height: 44px;
      background: #8B0000;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(212,175,55,.25), 0 6px 20px rgba(0,0,0,.4);
    }
    .lr-brand-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22px; font-weight: 700;
      color: #F5EDD6;
      letter-spacing: .3px;
    }
    .lr-role-pill {
      margin-left: 4px;
      display: inline-flex; align-items: center;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 9px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      background: rgba(212,175,55,.15);
      color: #D4AF37;
      border: 1px solid rgba(212,175,55,.3);
    }

    /* Hero */
    .lr-hero {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 0 24px;
      position: relative;
      z-index: 1;
    }
    .lr-tagline {
      font-size: 10px; font-weight: 600;
      letter-spacing: .15em; text-transform: uppercase;
      color: #D4AF37;
      margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .lr-tagline::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(212,175,55,.4) 0%, transparent 100%);
    }
    .lr-headline {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(26px, 3.5vw, 38px);
      line-height: 1.15;
      color: #F5EDD6;
      margin-bottom: 14px;
      font-weight: 600;
    }
    .lr-sub {
      font-size: 14px;
      color: rgba(245,237,214,.55);
      line-height: 1.65;
      margin-bottom: 32px;
      max-width: 300px;
    }

    /* Features */
    .lr-features { display: flex; flex-direction: column; gap: 10px; }
    .lr-feat {
      display: flex; align-items: center; gap: 14px;
      padding: 13px 14px;
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 10px;
      transition: border-color .2s, background .2s;
    }
    .lr-feat:hover {
      background: rgba(139,0,0,.12);
      border-color: rgba(139,0,0,.4);
    }
    .lr-feat-icon {
      width: 34px; height: 34px;
      border-radius: 8px;
      background: rgba(139,0,0,.22);
      display: flex; align-items: center; justify-content: center;
      color: #E87070;
      flex-shrink: 0;
      transition: background .2s;
    }
    .lr-feat:hover .lr-feat-icon { background: rgba(139,0,0,.35); }
    .lr-feat-label { font-size: 13px; font-weight: 600; color: #F5EDD6; }
    .lr-feat-desc  { font-size: 12px; color: rgba(245,237,214,.45); margin-top: 1px; }

    /* Left footer */
    .lr-footer {
      display: flex; align-items: center; gap: 7px;
      font-size: 11px; color: rgba(245,237,214,.3);
      position: relative; z-index: 1;
    }

    /* ══ RIGHT PANEL ══ */
    .lr-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FCFAFA;
      padding: 48px 32px;
      background-image:
        radial-gradient(ellipse at 80% 10%, rgba(139,0,0,.04) 0%, transparent 50%),
        radial-gradient(ellipse at 20% 90%, rgba(212,175,55,.04) 0%, transparent 50%);
    }
    .lr-form-box {
      width: 100%;
      max-width: 400px;
    }

    /* Back button */
    .lr-back {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500;
      color: #999;
      background: none; border: none;
      cursor: pointer; padding: 0;
      margin-bottom: 36px;
      transition: color .15s;
    }
    .lr-back:hover { color: #8B0000; }

    /* Form head */
    .lr-eyebrow {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700;
      letter-spacing: .12em; text-transform: uppercase;
      color: #8B0000;
      margin-bottom: 8px;
    }
    .lr-form-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(28px, 5vw, 36px);
      color: #1A0808;
      line-height: 1.15;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .lr-form-desc {
      font-size: 14px;
      color: #7A6060;
      margin-bottom: 28px;
      line-height: 1.5;
    }

    /* Error */
    .lr-error {
      display: flex; align-items: flex-start; gap: 10px;
      background: #FEF2F2;
      border: 1px solid #F5C2C2;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      color: #991B1B;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    /* Fields */
    .lr-fields { display: flex; flex-direction: column; gap: 18px; }
    .lr-field  { display: flex; flex-direction: column; gap: 7px; }
    .lr-field label {
      font-size: 13px; font-weight: 600;
      color: #4A3030;
      letter-spacing: .01em;
    }

    /* Unified input wrapper — shared by text inputs, password, and select */
    .lr-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1.5px solid #E5D5D5;
      border-radius: 8px;
      transition: border-color .2s, box-shadow .2s;
      overflow: hidden;
    }
    .lr-input-wrap:focus-within {
      border-color: #8B0000;
      box-shadow: 0 0 0 3px rgba(139,0,0,.10);
    }

    /* Text / password input inside wrapper */
    .lr-input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      padding: 13px 16px;
      font-family: 'DM Sans', sans-serif;
      font-size: max(16px, 15px);
      color: #1A0808;
    }
    .lr-input::placeholder { color: #C4AFAF; }

    /* Password toggle — lives inside .lr-input-wrap */
    .lr-pwd-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 44px;
      min-height: 48px;
      background: transparent;
      border: none;
      border-left: 1px solid #EDE0E0;
      cursor: pointer;
      color: #B5A0A0;
      transition: color .15s, background .15s;
      -webkit-tap-highlight-color: transparent;
    }
    .lr-pwd-toggle:hover {
      color: #8B0000;
      background: rgba(139,0,0,.04);
    }

    /* Select inside wrapper */
    .lr-select {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      padding: 13px 16px;
      font-family: 'DM Sans', sans-serif;
      font-size: max(16px, 15px);
      color: #1A0808;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    }
    .lr-select-wrap::after {
      content: '';
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px; height: 6px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23B5A0A0' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      pointer-events: none;
    }
    .lr-select option { background: #fff; color: #1A0808; }

    /* Submit button */
    .lr-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 52px;
      background: #8B0000;
      color: #FFFDF7;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      margin-top: 4px;
      box-shadow: 0 4px 16px rgba(139,0,0,.28);
      transition: background .2s, box-shadow .2s, transform .1s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      letter-spacing: .01em;
    }
    .lr-btn:hover:not(:disabled) {
      background: #6B0000;
      box-shadow: 0 6px 20px rgba(139,0,0,.38);
      transform: translateY(-1px);
    }
    .lr-btn:active:not(:disabled) { transform: translateY(0); }
    .lr-btn:disabled { opacity: .55; cursor: not-allowed; }

    /* Spinner */
    .lr-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,253,247,.3);
      border-top-color: #FFFDF7;
      border-radius: 50%;
      animation: lr-spin .65s linear infinite;
      flex-shrink: 0;
    }
    @keyframes lr-spin { to { transform: rotate(360deg); } }

    /* Secure note */
    .lr-secure {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #B5A0A0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* ══ RESPONSIVE ══ */

    /* Tablet narrow */
    @media (max-width: 900px) {
      .lr-left { width: 360px; padding: 36px 28px 28px; }
    }

    /* Stack vertically at ≤700px */
    @media (max-width: 700px) {
      .lr { flex-direction: column; }
      .lr-left {
        width: 100%;
        padding: 28px 20px 24px;
      }
      .lr-hero { padding: 16px 0 8px; }
      .lr-sub  { font-size: 13px; margin-bottom: 20px; max-width: 100%; }
      .lr-right {
        flex: 1;
        padding: 28px 20px 32px;
        padding-bottom: calc(28px + env(safe-area-inset-bottom));
        align-items: flex-start;
      }
      .lr-back { margin-bottom: 24px; }
      .lr-form-box { max-width: 100%; }
    }

    /* Phone ≤480px */
    @media (max-width: 480px) {
      .lr-left  { padding: 20px 16px 18px; }
      .lr-headline { font-size: 20px; }
      .lr-sub   { display: none; }
      .lr-hero  { padding: 12px 0 4px; }
      .lr-features { gap: 8px; }
      .lr-feat  { padding: 10px 12px; }
      .lr-feat-icon { width: 30px; height: 30px; }
      .lr-feat-label { font-size: 12px; }
      .lr-feat-desc  { font-size: 11px; }
      .lr-right { padding: 20px 16px 28px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
      .lr-form-title { font-size: 26px; }
      .lr-btn   { font-size: 15px; min-height: 50px; }
      .lr-input, .lr-select { font-size: 16px; }
    }

    /* Tiny phone ≤360px */
    @media (max-width: 360px) {
      .lr-left  { padding: 16px 12px 14px; }
      .lr-right { padding: 16px 12px 20px; }
      .lr-headline { font-size: 18px; }
      .lr-form-title { font-size: 22px; }
      .lr-feat  { padding: 9px 10px; gap: 10px; }
      .lr-feat-icon { width: 28px; height: 28px; border-radius: 6px; }
      .lr-btn   { min-height: 46px; font-size: 14px; }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .lr-spinner { animation: none; opacity: .7; }
      .lr-btn     { transition: none; }
    }
  `;

  return (
    <>
      <style>{css}</style>

      <div className="lr">

        {/* ── LEFT PANEL ── */}
        <div className="lr-left">
          <div className="lr-left-accent" />

          {/* Brand */}
          <div className="lr-brand">
            <div className="lr-logo"><LogoMark /></div>
            <span className="lr-brand-name">GoldLoan</span>
            <span className="lr-role-pill">{isOwner ? "Owner" : "Staff"}</span>
          </div>

          {/* Hero */}
          <div className="lr-hero">
            <div className="lr-tagline">
              {isOwner ? "Owner Portal" : "Staff Portal"}
            </div>
            <div className="lr-headline">
              {isOwner
                ? <>Full control,<br />complete visibility.</>
                : <>Branch finance,<br />handled with care.</>
              }
            </div>
            <div className="lr-sub">
              {isOwner
                ? "Monitor all branches, track activity and manage gold rates from one secure place."
                : "A complete management system for gold loan businesses — fast, secure, reliable."
              }
            </div>
            <div className="lr-features">
              {(isOwner ? ownerFeatures : staffFeatures).map(f => (
                <div className="lr-feat" key={f.label}>
                  <div className="lr-feat-icon">{f.icon}</div>
                  <div>
                    <div className="lr-feat-label">{f.label}</div>
                    <div className="lr-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="lr-footer">
            <LockIcon />
            256-bit encrypted · Secure session
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lr-right">
          <div className="lr-form-box">

            {/* Back to role select */}
            <button className="lr-back" onClick={() => navigate("/select-role")}>
              <BackArrow />
              Choose role
            </button>

            {/* Form head */}
            <div className="lr-eyebrow">
              {isOwner ? <StarIcon /> : <PersonIcon />}
              {isOwner ? "Owner Portal" : "Staff Portal"}
            </div>
            <div className="lr-form-title">Welcome back</div>
            <div className="lr-form-desc">
              {isOwner
                ? "Sign in with your owner credentials"
                : "Select your branch and sign in"
              }
            </div>

            {/* Error banner */}
            {error && (
              <div className="lr-error">
                <AlertCircle />
                {error}
              </div>
            )}

            {/* Fields */}
            <div className="lr-fields">

              {/* Branch — staff only */}
              {!isOwner && (
                <div className="lr-field">
                  <label htmlFor="branch">Branch</label>
                  <div className="lr-input-wrap lr-select-wrap">
                    <select
                      id="branch"
                      className="lr-select"
                      value={branch}
                      onChange={e => setBranch(Number(e.target.value))}
                    >
                      <option value="">
                        {branches.length === 0 ? "Loading branches…" : "Select your branch"}
                      </option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Username */}
              <div className="lr-field">
                <label htmlFor="username">Username</label>
                <div className="lr-input-wrap">
                  <input
                    id="username"
                    type="text"
                    className="lr-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={handleKey}
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lr-field">
                <label htmlFor="password">Password</label>
                <div className="lr-input-wrap">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    className="lr-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lr-pwd-toggle"
                    onClick={() => setShowPwd(p => !p)}
                    tabIndex={-1}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                className="lr-btn"
                onClick={handleLogin}
                disabled={loading || !canSubmit}
              >
                {loading
                  ? <><span className="lr-spinner" /> Signing in…</>
                  : `Sign in as ${isOwner ? "Owner" : "Staff"}`
                }
              </button>
            </div>

            {/* Secure note */}
            <div className="lr-secure">
              <LockIcon />
              Secured with 256-bit encryption
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
