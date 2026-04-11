import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SelectRole() {
    const navigate = useNavigate();

    useEffect(() => {
        // Already logged in — skip
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");
        if (token && role) navigate(`/${role}`, { replace: true });
    }, [navigate]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        .sr-root {
          min-height: 100vh;
          background: #F7F3EB;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background texture */
        .sr-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(26,60,43,.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 80%, rgba(200,150,42,.06) 0%, transparent 60%);
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
          gap: 10px;
          margin-bottom: 40px;
          animation: sr-up .5s ease both;
        }

        .sr-logo {
          width: 40px; height: 40px;
          background: #C8962A;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(200,150,42,.28);
        }

        .sr-brand-name {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #1A2E1F;
          letter-spacing: -.01em;
        }

        /* Heading */
        .sr-head {
          text-align: center;
          margin-bottom: 32px;
          animation: sr-up .5s ease .1s both;
        }

        .sr-title {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: #1A2E1F;
          letter-spacing: -.01em;
          margin-bottom: 6px;
        }

        .sr-sub {
          font-size: 14px;
          color: #4A6352;
        }

        /* Role cards */
        .sr-cards {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .sr-card {
          background: #FFFDF7;
          border: 1px solid #DED8C8;
          border-radius: 14px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          cursor: pointer;
          transition: border-color .18s, box-shadow .18s, transform .15s;
          text-align: left;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 1px 4px rgba(26,60,43,.05);
          position: relative;
          overflow: hidden;
        }

        .sr-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(26,60,43,.0);
          transition: background .18s;
          border-radius: inherit;
        }

        .sr-card:hover {
          border-color: #1A3C2B;
          box-shadow: 0 6px 24px rgba(26,60,43,.12);
          transform: translateY(-2px);
        }

        .sr-card:active { transform: translateY(0); }

        .sr-card.staff {
          animation: sr-up .5s ease .2s both;
        }
        .sr-card.owner {
          animation: sr-up .5s ease .3s both;
        }

        .sr-card-icon {
          width: 52px; height: 52px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sr-card.staff .sr-card-icon {
          background: #E6F4EC;
          color: #1B5235;
        }

        .sr-card.owner .sr-card-icon {
          background: #FBF5E6;
          color: #7A5A10;
        }

        .sr-card-body { flex: 1; }

        .sr-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1A2E1F;
          margin-bottom: 3px;
          letter-spacing: -.01em;
        }

        .sr-card-desc {
          font-size: 13px;
          color: #4A6352;
          line-height: 1.5;
        }

        .sr-card-arrow {
          color: #C9C2AF;
          flex-shrink: 0;
          transition: color .18s, transform .18s;
        }

        .sr-card:hover .sr-card-arrow {
          color: #1A3C2B;
          transform: translateX(3px);
        }

        /* Footer */
        .sr-footer {
          margin-top: 36px;
          text-align: center;
          font-size: 12px;
          color: #8FAD96;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          animation: sr-up .5s ease .4s both;
        }

        @keyframes sr-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        @media (max-width: 480px) {
          .sr-card { padding: 18px; }
          .sr-card-icon { width: 44px; height: 44px; border-radius: 11px; }
          .sr-title { font-size: 24px; }
        }
      `}</style>

            <div className="sr-root">
                <div className="sr-inner">

                    {/* Brand */}
                    <div className="sr-brand">
                        <div className="sr-logo">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <polygon points="10,2 18,6 18,14 10,18 2,14 2,6"
                                    fill="none" stroke="#fff" strokeWidth="1.6" />
                                <circle cx="10" cy="10" r="3" fill="#fff" />
                            </svg>
                        </div>
                        <span className="sr-brand-name">GoldLoan</span>
                    </div>

                    {/* Heading */}
                    <div className="sr-head">
                        <div className="sr-title">Who are you?</div>
                        <div className="sr-sub">Select your role to continue</div>
                    </div>

                    {/* Role cards */}
                    <div className="sr-cards">

                        {/* Staff */}
                        <button className="sr-card staff" onClick={() => navigate("/login/staff")}>
                            <div className="sr-card-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="sr-card-body">
                                <div className="sr-card-title">Staff</div>
                                <div className="sr-card-desc">Create loans, record payments, search customers</div>
                            </div>
                            <svg className="sr-card-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* Owner */}
                        <button className="sr-card owner" onClick={() => navigate("/login/owner")}>
                            <div className="sr-card-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9"
                                        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sr-card-body">
                                <div className="sr-card-title">Owner</div>
                                <div className="sr-card-desc">View reports, activity logs, gold rate settings</div>
                            </div>
                            <svg className="sr-card-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                    </div>

                    {/* Footer */}
                    <div className="sr-footer">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="2" y="5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
                            <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" />
                        </svg>
                        Secured · Branch Management System
                    </div>

                </div>
            </div>
        </>
    );
}
