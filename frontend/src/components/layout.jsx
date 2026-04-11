import { Link, useLocation, useNavigate } from "react-router-dom";

const NAV = {
  staff: [
    {
      to: "/staff", label: "Dashboard", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    },
    {
      to: "/create-loan", label: "New Loan", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      to: "/search-loan", label: "Search", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13.5 13.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      to: "/staff-summary", label: "Summary", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 15l4-5 3 2.5 3-5.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    },
  ],
  owner: [
    {
      to: "/owner", label: "Dashboard", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    },
    {
      to: "/owner-activity", label: "Activity", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10h3l2-5 3 10 2-7 2 4 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      to: "/gold-rate-settings", label: "Gold Rate", icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polygon points="10,2 13,7 18,8 14,12 15,17 10,14.5 5,17 6,12 2,8 7,7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      )
    },
  ],
};

const TERM_OVER = {
  to: "/term-over", label: "Term Over", icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
};

export default function Layout({ children }) {
  const role = sessionStorage.getItem("role");
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [...(NAV[role] || []), TERM_OVER];
  // Bottom nav: show max 5 items (all for staff=5, owner=4)
  const bottomItems = navItems.slice(0, 5);

  const isActive = (to) => location.pathname === to;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ly-root {
          display: flex;
          min-height: 100vh;
          background: #F7F3EB;
          font-family: 'DM Sans', sans-serif;
        }

        /* ══ SIDEBAR (desktop) ══ */
        .ly-sidebar {
          width: 232px;
          flex-shrink: 0;
          background: #1A3C2B;
          display: flex;
          flex-direction: column;
          padding: 0;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          overflow: hidden;
        }

        .ly-sidebar-top {
          padding: 24px 20px 16px;
          border-bottom: 0.5px solid rgba(255,253,247,.08);
        }

        .ly-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ly-logo {
          width: 36px; height: 36px;
          background: #C8962A;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .ly-brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #FFFDF7;
          letter-spacing: -.02em;
          line-height: 1.2;
        }

        .ly-brand-role {
          font-size: 11px;
          color: #5A7A65;
          text-transform: capitalize;
          letter-spacing: .03em;
        }

        .ly-nav {
          flex: 1;
          padding: 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .ly-nav-section {
          font-size: 10px;
          font-weight: 500;
          color: #3A5A45;
          text-transform: uppercase;
          letter-spacing: .08em;
          padding: 10px 8px 4px;
        }

        .ly-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 400;
          color: #8FAD96;
          transition: background .15s, color .15s;
          cursor: pointer;
        }

        .ly-nav-link:hover {
          background: rgba(255,253,247,.07);
          color: #FFFDF7;
        }

        .ly-nav-link.active {
          background: rgba(200,150,42,.15);
          color: #E8C06A;
          font-weight: 500;
        }

        .ly-nav-link.term-over {
          color: #E88A8A;
          margin-top: 4px;
        }
        .ly-nav-link.term-over:hover { background: rgba(220,60,60,.10); color: #FFAAAA; }
        .ly-nav-link.term-over.active { background: rgba(220,60,60,.15); color: #FFAAAA; }

        .ly-nav-icon { flex-shrink: 0; opacity: .9; }

        .ly-sidebar-footer {
          padding: 12px;
          border-top: 0.5px solid rgba(255,253,247,.08);
        }

        .ly-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          border-radius: 8px;
          background: none;
          border: none;
          font-size: 13px;
          color: #5A7A65;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background .15s, color .15s;
        }
        .ly-logout-btn:hover { background: rgba(220,60,60,.10); color: #E88A8A; }

        /* ══ MAIN CONTENT ══ */
        .ly-main {
          margin-left: 232px;
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Top bar (desktop) */
        .ly-topbar {
          background: #FFFDF7;
          border-bottom: 0.5px solid #DED8C8;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .ly-topbar-title {
          font-size: 15px;
          font-weight: 600;
          color: #1A2E1F;
          letter-spacing: -.01em;
        }

        .ly-topbar-role-badge {
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 20px;
          background: #E6F4EC;
          color: #1B5235;
          text-transform: capitalize;
          letter-spacing: .03em;
        }

        .ly-content {
          flex: 1;
          padding: 28px;
        }

        /* ══ MOBILE TOP BAR ══ */
        .ly-mobile-topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: #1A3C2B;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 50;
        }

        .ly-mobile-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .ly-mobile-brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #FFFDF7;
          letter-spacing: -.02em;
        }

        /* ══ MOBILE BOTTOM NAV ══ */
        .ly-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #1A3C2B;
          border-top: 0.5px solid rgba(255,253,247,.10);
          z-index: 50;
          padding: 0 4px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .ly-bottom-nav-inner {
          display: flex;
          align-items: stretch;
          height: 62px;
        }

        .ly-bottom-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #5A7A65;
          font-size: 10px;
          font-weight: 500;
          padding: 8px 4px;
          border-radius: 10px;
          transition: color .15s, background .15s;
          cursor: pointer;
          letter-spacing: .01em;
          margin: 4px 2px;
        }

        .ly-bottom-item:hover { color: #8FAD96; }

        .ly-bottom-item.active {
          color: #E8C06A;
          background: rgba(200,150,42,.12);
        }

        .ly-bottom-item.term-over { color: #E88A8A; }
        .ly-bottom-item.term-over.active { color: #FFAAAA; background: rgba(220,60,60,.12); }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 768px) {
          .ly-sidebar   { display: none; }
          .ly-topbar    { display: none; }
          .ly-main      { margin-left: 0; padding-top: 56px; padding-bottom: 70px; }
          .ly-content   { padding: 16px; }
          .ly-mobile-topbar { display: flex; }
          .ly-bottom-nav    { display: block; }
        }

        @media (max-width: 420px) {
          .ly-content { padding: 12px; }
          .ly-bottom-item { font-size: 9px; }
        }
      `}</style>

      <div className="ly-root">

        {/* ── Desktop Sidebar ── */}
        <aside className="ly-sidebar">
          <div className="ly-sidebar-top">
            <div className="ly-brand">
              <div className="ly-logo">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" fill="none" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="9" cy="9" r="2.5" fill="#fff" />
                </svg>
              </div>
              <div>
                <div className="ly-brand-name">GoldLoan</div>
                <div className="ly-brand-role">{role}</div>
              </div>
            </div>
          </div>

          <nav className="ly-nav">
            <div className="ly-nav-section">Menu</div>

            {(NAV[role] || []).map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`ly-nav-link${isActive(item.to) ? " active" : ""}`}
              >
                <span className="ly-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="ly-nav-section" style={{ marginTop: 8 }}>Alerts</div>
            <Link
              to={TERM_OVER.to}
              className={`ly-nav-link term-over${isActive(TERM_OVER.to) ? " active" : ""}`}
            >
              <span className="ly-nav-icon">{TERM_OVER.icon}</span>
              {TERM_OVER.label}
            </Link>
          </nav>

          <div className="ly-sidebar-footer">
            <button className="ly-logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Mobile Top Bar ── */}
        <div className="ly-mobile-topbar">
          <div className="ly-mobile-brand">
            <div className="ly-logo">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" fill="none" stroke="#fff" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="2.5" fill="#fff" />
              </svg>
            </div>
            <span className="ly-mobile-brand-name">GoldLoan</span>
          </div>
          <button className="ly-logout-btn" style={{ width: "auto", padding: "6px 10px" }} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Main Content ── */}
        <div className="ly-main">
          {/* Desktop top bar */}
          <div className="ly-topbar">
            <span className="ly-topbar-title">GoldLoan System</span>
            <span className="ly-topbar-role-badge">{role}</span>
          </div>

          <div className="ly-content">
            {children}
          </div>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="ly-bottom-nav">
          <div className="ly-bottom-nav-inner">
            {bottomItems.map((item, i) => {
              const isTermOver = item.to === TERM_OVER.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`ly-bottom-item${isTermOver ? " term-over" : ""}${isActive(item.to) ? " active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}
