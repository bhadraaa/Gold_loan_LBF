import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function Splash() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");
        if (token && role) {
            navigate(`/${role}`, { replace: true });
            return;
        }

        const timer = setTimeout(() => {
            navigate("/select-role", { replace: true });
        }, 5000); // Increased slightly for readability of two names

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap');

        .splash-root {
          min-height: 100vh;
          background: #0B2418; /* Darker forest green to match logo vibe */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .splash-root::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,150,42,.12) 0%, transparent 70%);
          top: -150px; right: -150px;
        }

        .splash-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          z-index: 1;
          animation: splash-fade-in .8s ease both;
        }

        @keyframes splash-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .splash-logo-container {
          width: 120px; 
          height: 120px;
          margin-bottom: 10px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(200,150,42,.2);
          animation: logo-zoom 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes logo-zoom {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .splash-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-primary {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: #C8962A; /* Gold color from logo */
          margin: 0;
          line-height: 1.2;
        }

        .brand-secondary {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: #FFFDF7;
          letter-spacing: 1px;
          margin-top: -5px;
        }

        .splash-tagline {
          font-size: 12px;
          color: #5A7A65;
          letter-spacing: .15em;
          text-transform: uppercase;
          margin-top: 10px;
        }

        .splash-dots {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }

        .splash-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #C8962A;
          animation: splash-dot-pulse 1.2s ease-in-out infinite;
        }
        .splash-dot:nth-child(2) { animation-delay: .2s; }
        .splash-dot:nth-child(3) { animation-delay: .4s; }

        @keyframes splash-dot-pulse {
          0%, 100% { opacity: .3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }

        .splash-version {
          position: absolute;
          bottom: 24px;
          font-size: 10px;
          color: rgba(90, 122, 101, 0.5);
        }
      `}</style>

            <div className="splash-root">
                <div className="splash-center">
                    <div className="splash-logo-container">
                        <img
                            src={logoImg}
                            alt="Lakshmi Bhadra Logo"
                            className="splash-logo-img"
                        />
                    </div>

                    <h1 className="brand-primary">Lakshmi Bhadra Adithi</h1>
                    <h2 className="brand-secondary">Financiers</h2>

                    <div className="splash-tagline">Branch Management System</div>

                    <div className="splash-dots">
                        <div className="splash-dot" />
                        <div className="splash-dot" />
                        <div className="splash-dot" />
                    </div>
                </div>
                <div className="splash-version">v1.0.0</div>
            </div>
        </>
    );
}