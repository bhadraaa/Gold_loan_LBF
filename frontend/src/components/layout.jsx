import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import newLogo from "../assets/NEWlogo.svg";

const NAV = {
  staff: [
    {
      to: "/staff", label: "Dashboard", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      )
    },
    {
      to: "/create-loan", label: "New Loan", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
      )
    },
    {
      to: "/search-loan", label: "Search", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      )
    },
    {
      to: "/staff-summary", label: "Analytics", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      )
    },
  ],
  owner: [
    {
      to: "/owner", label: "Overview", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      )
    },
    {
      to: "/owner-activity", label: "Audit Log", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
      )
    },
    {
      to: "/gold-rate-settings", label: "Gold Rate", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
      )
    },
  ],
};

const TERM_OVER = {
  to: "/term-over", label: "Overdue", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  )
};

export default function Layout({ children }) {
  const role = sessionStorage.getItem("role");
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [...(NAV[role] || []), TERM_OVER];
  const bottomItems = navItems.slice(0, 5);

  const isActive = (to) => location.pathname === to;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ly-root {
          display: flex;
          min-height: 100vh;
          background: #F9F9F9;
          font-family: 'Inter', sans-serif;
        }

        /* ══ SIDEBAR (Desktop) ══ */
        .ly-sidebar {
          width: 250px;
          flex-shrink: 0;
          background: #1A1A1A; /* Deep Charcoal */
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        .ly-sidebar-top {
          padding: 32px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .ly-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ly-logo {
          width: 40px; height: 40px;
          background: #8B0000; /* Deep Red */
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
        }

        .ly-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .ly-brand-role {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .ly-nav {
          flex: 1;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ly-nav-section {
          font-size: 10px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px 12px 6px;
        }

        .ly-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: #AAA;
          transition: all 0.2s;
        }

        .ly-nav-link:hover {
          color: #FFF;
          background: rgba(255,255,255,0.05);
        }

        .ly-nav-link.active {
          background: #8B0000;
          color: #FFF;
          box-shadow: 0 4px 15px rgba(139, 0, 0, 0.2);
        }

        .ly-nav-link.term-over { color: #FF6B6B; }
        .ly-nav-link.term-over.active { background: #D32F2F; }

        .ly-sidebar-footer {
          padding: 20px;
          background: rgba(0,0,0,0.2);
        }

        .ly-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 13px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ly-logout-btn:hover {
          background: #8B0000;
          color: #FFF;
          border-color: #8B0000;
        }

        /* ══ MAIN CONTENT ══ */
        .ly-main {
          margin-left: 250px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .ly-topbar {
          background: #FFF;
          border-bottom: 1px solid #EEE;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .ly-topbar-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1A1A1A;
        }

        .ly-topbar-role-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 4px;
          background: #F0F0F0;
          color: #8B0000;
          text-transform: uppercase;
        }

        .ly-content {
          flex: 1;
          padding: 40px;
        }

        /* ══ MOBILE ADAPTATION ══ */
        .ly-mobile-topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: #1A1A1A;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
        }

        .ly-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #FFF;
          border-top: 1px solid #EEE;
          z-index: 100;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .ly-bottom-nav-inner {
          display: flex;
          height: 65px;
        }

        .ly-bottom-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #999;
          font-size: 10px;
          font-weight: 600;
          transition: 0.2s;
        }

        .ly-bottom-item.active {
          color: #8B0000;
        }

        @media (max-width: 768px) {
          .ly-sidebar, .ly-topbar { display: none; }
          .ly-main { margin-left: 0; padding-top: 60px; padding-bottom: 70px; }
          .ly-content { padding: 20px; }
          .ly-mobile-topbar { display: flex; }
          .ly-bottom-nav { display: block; }
        }
      `}</style>

      <div className="ly-root">
        {/* Desktop Sidebar */}
        <aside className="ly-sidebar">
          <div className="ly-sidebar-top">
            <div className="ly-brand">
              <div className="ly-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <div className="ly-brand-name">Lakshmi Bhadra</div>
                <div className="ly-brand-role">{role} Access</div>
              </div>
            </div>
          </div>

          <nav className="ly-nav">
            <div className="ly-nav-section">Operations</div>
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

            <div className="ly-nav-section" style={{ marginTop: 16 }}>Monitoring</div>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Secure Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Top Bar */}
        <div className="ly-mobile-topbar">
          <div className="ly-brand">
            <div className="ly-logo" style={{ width: 32, height: 32, padding: "2px", background: "transparent", boxShadow: "none" }}>
              <img src={newLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span className="ly-brand-name" style={{ fontSize: 14 }}>L.B.A</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="ly-main">
          <div className="ly-topbar">
            <span className="ly-topbar-title">Financial Control System</span>
            <span className="ly-topbar-role-badge">{role} Portal</span>
          </div>

          <div className="ly-content">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="ly-bottom-nav">
          <div className="ly-bottom-nav-inner">
            {bottomItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`ly-bottom-item${isActive(item.to) ? " active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}