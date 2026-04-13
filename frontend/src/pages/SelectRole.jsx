import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SelectRole() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    if (token && role) navigate(`/${role}`, { replace: true });
  }, [navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');

        .sr-root {
          min-height: 100vh;
          background: #FCFAFA; /* Alabaster White */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background texture in Crimson/Gold */
        .sr-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 0, 0, .03) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 80%, rgba(212, 175, 55, .05) 0%, transparent 60%);
          pointer-events: none;
        }

        .sr-inner {
          width: 100%;
          max-width: 480px;
          z-index: 1;
        }

        /* Brand top */
        .sr-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 48px;
          animation: sr-up .5s ease both;
        }

        .sr-logo {
          width: 44px; height: 44px;
          background: #8B0000; /* Deep Crimson */
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139, 0, 0, .2);
        }

        .sr-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #1F1111; /* Espresso */
          letter-spacing: -0.01em;
          font-weight: 700;
        }

        /* Heading */
        .sr-head {
          text-align: center;
          margin-bottom: 36px;
          animation: sr-up .5s ease .1s both;
        }

        .sr-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          color: #8B0000;
          letter-spacing: -.01em;
          margin-bottom: 8px;
        }

        .sr-sub {
          font-size: 15px;
          color: #5C5252;
          font-weight: 400;
        }

        /* Role cards */
        .sr-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sr-card {
          background: #FFFFFF;
          border: 1px solid #F0E6E6;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
          box-shadow: 0 2px 6px rgba(31, 17, 17, .03);
          position: relative;
        }

        .sr-card:hover {
          border-color: #8B0000;
          box-shadow: 0 10px 30px rgba(139, 0, 0, .08);
          transform: translateY(-3px);
        }

        .sr-card:active { transform: translateY(-1px); }

        .sr-card.staff { animation: sr-up .5s ease .2s both; }
        .sr-card.owner { animation: sr-up .5s ease .3s both; }

        .sr-card-icon {
          width: 56px; height: 56px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform .3s ease;
        }

        .sr-card:hover .sr-card-icon { transform: scale(1.1); }

        .sr-card.staff .sr-card-icon {
          background: #FEF2F2;
          color: #8B0000;
        }

        .sr-card.owner .sr-card-icon {
          background: #FFF9F9;
          color: #D4AF37;
          border: 1px solid #F0E6E6;
        }

        .sr-card-body { flex: 1; }

        .sr-card-title {
          font-size: 17px;
          font-weight: 600;
          color: #1F1111;
          margin-bottom: 4px;
        }

        .sr-card-desc {
          font-size: 14px;
          color: #5C5252;
          line-height: 1.5;
        }

        .sr-card-arrow {
          color: #D6C2C2;
          flex-shrink: 0;
          transition: all .2s ease;
        }

        .sr-card:hover .sr-card-arrow {
          color: #8B0000;
          transform: translateX(4px);
        }

        /* Footer */
        .sr-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 13px;
          color: #B5A8A8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: sr-up .5s ease .4s both;
        }

        @keyframes sr-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @media (max-width: 480px) {
          .sr-card { padding: 20px; }
          .sr-title { font-size: 26px; }
        }
      `}</style>

      <div className="sr-root">
        <div className="sr-inner">

          {/* Brand */}
          <div className="sr-brand">
            <div className="sr-logo">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,6 18,14 10,18 2,14 2,6"
                  fill="none" stroke="#fff" strokeWidth="1.6" />
                <circle cx="10" cy="10" r="3" fill="#fff" />
              </svg>
            </div>
            <span className="sr-brand-name">GoldLoan</span>
          </div>

          {/* Heading */}
          <div className="sr-head">
            <div className="sr-title">Welcome Back</div>
            <div className="sr-sub">Select your portal to continue</div>
          </div>

          {/* Role cards */}
          <div className="sr-cards">

            {/* Staff */}
            <button className="sr-card staff" onClick={() => navigate("/login/staff")}>
              <div className="sr-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="sr-card-body">
                <div className="sr-card-title">Staff Portal</div>
                <div className="sr-card-desc">Manage loans, payments, and customer records</div>
              </div>
              <svg className="sr-card-arrow" width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Owner */}
            <button className="sr-card owner" onClick={() => navigate("/login/owner")}>
              <div className="sr-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
                    stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="sr-card-body">
                <div className="sr-card-title">Administration</div>
                <div className="sr-card-desc">Analytics, activity logs, and system settings</div>
              </div>
              <svg className="sr-card-arrow" width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

          </div>

          {/* Footer */}
          <div className="sr-footer">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Secure Branch Management System
          </div>

        </div>
      </div>
    </>
  );
}