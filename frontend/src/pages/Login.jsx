import { useState, useEffect } from "react";
import api from "../axiosConfig";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/gl.css";

const staffFeatures = [
  {
    label: "Loan Management", desc: "Create, track & close loans", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Gold Custody", desc: "Record items & weights", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,2 16,6 16,12 9,16 2,12 2,6" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  },
  {
    label: "Branch Reports", desc: "Daily summaries & analytics", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 14l3.5-4 3 2.5 3-5 2.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  },
];

const ownerFeatures = [
  {
    label: "All Branch Overview", desc: "Monitor every branch at once", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  },
  {
    label: "Activity Logs", desc: "Track every staff action", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 9h3l2-5 3 10 2-6 2 3 2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: "Gold Rate Settings", desc: "Set & update gold rates", icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polygon points="9,1.5 11,6.5 16.5,7 12.5,11 13.5,16.5 9,14 4.5,16.5 5.5,11 1.5,7 7,6.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </svg>
    )
  },
];

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

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const r = sessionStorage.getItem("role");
    if (token && r) navigate(`/${r}`, { replace: true });
  }, [navigate]);

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

  // Theme colors based on role
  const accent = isOwner ? "#92400E" : "#1A3C2B";
  const accentHov = isOwner ? "#7A3310" : "#254D38";
  const panelBg = isOwner ? "#2C1A0E" : "#1A3C2B";
  const focusRing = isOwner ? "rgba(146,64,14,.10)" : "rgba(26,60,43,.10)";
  const subColor = isOwner ? "#A07850" : "#8FAD96";
  const descColor = isOwner ? "#7A5A3A" : "#5A7A65";
  const footerClr = isOwner ? "#5A3A20" : "#3A5A45";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Serif+Display&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          background: #F7F3EB;
          font-family: 'DM Sans', sans-serif;
        }

        .login-left {
          width: 420px;
          flex-shrink: 0;
          background: ${panelBg};
          display: flex;
          flex-direction: column;
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 110% 10%, rgba(200,150,42,.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at -10% 90%, rgba(200,150,42,.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-brand { display: flex; align-items: center; gap: 10px; margin-bottom: auto; }

        .login-logo-mark {
          width: 44px; height: 44px; background: #C8962A; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .login-brand-name { font-size: 18px; font-weight: 600; color: #FFFDF7; letter-spacing: -.02em; }

        .login-role-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 500;
          letter-spacing: .04em; text-transform: uppercase;
          background: rgba(200,150,42,.20);
          color: #E8C06A;
          border: 0.5px solid rgba(200,150,42,.35);
        }

        .login-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }

        .login-hero-headline {
          font-family: 'DM Serif Display', serif; font-size: 34px;
          line-height: 1.22; color: #FFFDF7; margin-bottom: 14px; letter-spacing: -.01em;
        }

        .login-hero-sub {
          font-size: 14px; color: ${subColor}; line-height: 1.7; margin-bottom: 36px; max-width: 280px;
        }

        .login-features { display: flex; flex-direction: column; gap: 10px; }

        .login-feature-item {
          display: flex; align-items: center; gap: 14px; padding: 13px 16px;
          background: rgba(255,253,247,.06); border: 0.5px solid rgba(255,253,247,.10);
          border-radius: 10px; transition: background .2s;
        }
        .login-feature-item:hover { background: rgba(255,253,247,.09); }

        .login-feature-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: rgba(200,150,42,.18); border: 0.5px solid rgba(200,150,42,.30);
          display: flex; align-items: center; justify-content: center;
          color: #E8C06A; flex-shrink: 0;
        }

        .login-feature-label { font-size: 13px; font-weight: 500; color: #E2E8F0; }
        .login-feature-desc  { font-size: 12px; color: ${descColor}; margin-top: 1px; }

        .login-left-footer {
          font-size: 11px; color: ${footerClr};
          display: flex; align-items: center; gap: 6px;
        }

        /* Right */
        .login-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 48px 32px; background: #F7F3EB;
        }

        .login-form-box { width: 100%; max-width: 380px; }

        .login-back {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; color: #8FAD96; cursor: pointer;
          background: none; border: none; font-family: 'DM Sans', sans-serif;
          padding: 0; margin-bottom: 28px; transition: color .15s;
        }
        .login-back:hover { color: #4A6352; }

        .login-form-head { margin-bottom: 28px; }

        .login-form-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: .08em;
          text-transform: uppercase; color: ${accent};
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }

        .login-form-title {
          font-family: 'DM Serif Display', serif; font-size: 30px;
          color: #1A2E1F; letter-spacing: -.01em; line-height: 1.2; margin-bottom: 6px;
        }

        .login-form-desc { font-size: 14px; color: #4A6352; }

        .login-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #FDECEA; border: 0.5px solid #E8A09A;
          border-radius: 8px; padding: 11px 14px;
          font-size: 13px; color: #7D1F16; margin-bottom: 20px;
        }

        .login-fields { display: flex; flex-direction: column; gap: 16px; }
        .login-field  { display: flex; flex-direction: column; gap: 6px; }
        .login-field label { font-size: 12px; font-weight: 500; color: #4A6352; }

        .login-input-wrap { position: relative; }

        .login-input {
          width: 100%; background: #FFFDF7; border: 1px solid #C9C2AF;
          border-radius: 8px; padding: 11px 14px; font-size: 14px;
          font-family: 'DM Sans', sans-serif; color: #1A2E1F; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .login-input:focus {
          border-color: ${accent};
          box-shadow: 0 0 0 3px ${focusRing};
        }
        .login-input::placeholder { color: #8FAD96; }
        .login-input.has-toggle   { padding-right: 42px; }

        .login-pwd-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #8FAD96;
          display: flex; align-items: center; padding: 2px; transition: color .15s;
        }
        .login-pwd-toggle:hover { color: ${accent}; }

        .login-btn {
          width: 100%; background: ${accent}; color: #FFFDF7; border: none;
          border-radius: 8px; padding: 13px; font-size: 15px;
          font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background .15s, transform .1s, box-shadow .15s;
          margin-top: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
        .login-btn:hover:not(:disabled) { background: ${accentHov}; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
        .login-btn:active:not(:disabled) { transform: scale(.98); }
        .login-btn:disabled { opacity: .55; cursor: not-allowed; }

        .login-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,253,247,.30);
          border-top-color: #FFFDF7; border-radius: 50%;
          animation: spin .65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-secure {
          margin-top: 20px; text-align: center; font-size: 12px; color: #8FAD96;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        @media (max-width: 900px) {
          .login-left { width: 340px; padding: 36px 28px; }
          .login-hero-headline { font-size: 28px; }
        }

        @media (max-width: 700px) {
          .login-root { flex-direction: column; }
          .login-left {
            width: 100%; flex-direction: row; align-items: center;
            padding: 20px 24px; gap: 16px; flex-shrink: 0;
          }
          .login-brand { margin-bottom: 0; }
          .login-hero { display: none; }
          .login-left-footer { display: none; }
          .login-right { padding: 32px 20px; align-items: flex-start; }
          .login-form-box { max-width: 100%; }
          .login-form-title { font-size: 26px; }
        }

        @media (max-width: 420px) {
          .login-left { padding: 16px 20px; }
          .login-right { padding: 24px 16px; }
          .login-form-title { font-size: 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Left Panel ── */}
        <div className="login-left">
          <div className="login-brand">
            <div className="login-logo-mark">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" fill="none" stroke="#fff" strokeWidth="1.6" />
                <circle cx="11" cy="11" r="3" fill="#fff" />
              </svg>
            </div>
            <span className="login-brand-name">GoldLoan</span>
            <span className="login-role-pill">{isOwner ? "Owner" : "Staff"}</span>
          </div>

          <div className="login-hero">
            <div className="login-hero-headline">
              {isOwner
                ? <>Full control,<br />complete visibility.</>
                : <>Branch finance,<br />handled with care.</>
              }
            </div>
            <div className="login-hero-sub">
              {isOwner
                ? "Monitor all branches, track activity, and manage gold rates from one place."
                : "A complete management system for gold loan businesses — fast, secure, and reliable."
              }
            </div>
            <div className="login-features">
              {(isOwner ? ownerFeatures : staffFeatures).map(f => (
                <div className="login-feature-item" key={f.label}>
                  <div className="login-feature-icon">{f.icon}</div>
                  <div>
                    <div className="login-feature-label">{f.label}</div>
                    <div className="login-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="login-left-footer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
              <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            256-bit encrypted · Secure session
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="login-right">
          <div className="login-form-box">

            {/* Back to role select */}
            <button className="login-back" onClick={() => navigate("/select-role")}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Choose role
            </button>

            <div className="login-form-head">
              <div className="login-form-eyebrow">
                {isOwner
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="6,1 7.5,4.3 11,4.8 8.6,7.1 9.2,10.6 6,9 2.8,10.6 3.4,7.1 1,4.8 4.5,4.3" stroke="currentColor" strokeWidth=".9" fill="none" /></svg>
                  : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.2" stroke="currentColor" strokeWidth="1" /><path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                }
                {isOwner ? "Owner Portal" : "Staff Portal"}
              </div>
              <div className="login-form-title">Welcome back</div>
              <div className="login-form-desc">
                {isOwner ? "Sign in with your owner credentials" : "Select your branch and sign in"}
              </div>
            </div>

            {error && (
              <div className="login-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <div className="login-fields">

              {/* Branch — staff only */}
              {!isOwner && (
                <div className="login-field">
                  <label>Branch</label>
                  <select
                    className="login-input"
                    value={branch}
                    onChange={e => setBranch(Number(e.target.value))}
                  >
                    <option value="">
                      {branches.length === 0 ? "Loading branches…" : "Select branch"}
                    </option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="login-field">
                <label>Username</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKey}
                  autoFocus
                />
              </div>

              <div className="login-field">
                <label>Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    className="login-input has-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    autoComplete="current-password"
                  />
                  <button className="login-pwd-toggle" onClick={() => setShowPwd(p => !p)} tabIndex={-1} type="button">
                    {showPwd ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                        <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                className="login-btn"
                onClick={handleLogin}
                disabled={loading || !canSubmit}
              >
                {loading
                  ? <><span className="login-spinner" /> Signing in…</>
                  : `Sign in as ${isOwner ? "Owner" : "Staff"}`
                }
              </button>
            </div>

            <div className="login-secure">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
                <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" />
              </svg>
              Secured with 256-bit encryption
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
