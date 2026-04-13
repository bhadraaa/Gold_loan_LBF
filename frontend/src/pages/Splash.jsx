import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoVideo from "../assets/download.mp4";

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
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');

        .splash-root {
          min-height: 100vh;
          background: #FFFFFF; /* Pure White Background */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* Subtle Light Red Decorative Circle */
        .splash-root::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 0, 0, 0.03) 0%, transparent 70%);
          bottom: -100px; left: -100px;
        }

        .splash-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 1;
        }

        /* Video Container */
        .video-box {
          width: 200px;
          height: 200px;
          border-radius: 50%; 
          overflow: hidden;
          background: #F8F8F8;
          box-shadow: 0 15px 35px rgba(139, 0, 0, 0.1);
          margin-bottom: 25px;
          animation: logo-pop 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .splash-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes logo-pop {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .brand-primary {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #8B0000; /* Deep Red Primary */
          margin: 0;
          line-height: 1.2;
        }

        .brand-secondary {
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #1A1A1A; /* Charcoal/Black for contrast */
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-top: 5px;
        }

        .splash-tagline {
          font-size: 13px;
          font-weight: 500;
          color: #5C1A1A; /* Muted Dark Red */
          letter-spacing: .15em;
          text-transform: uppercase;
          margin-top: 15px;
          opacity: 0.7;
        }

        .splash-dots {
          display: flex;
          gap: 10px;
          margin-top: 30px;
        }

        .splash-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #8B0000; /* Red Dots */
          animation: splash-dot-pulse 1.2s ease-in-out infinite;
        }
        .splash-dot:nth-child(2) { animation-delay: .2s; }
        .splash-dot:nth-child(3) { animation-delay: .4s; }

        @keyframes splash-dot-pulse {
          0%, 100% { opacity: .2; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }

        .splash-version {
          position: absolute;
          bottom: 24px;
          font-size: 11px;
          color: #999;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="splash-root">
        <div className="splash-center">
          <div className="video-box">
            <video
              autoPlay
              muted
              playsInline
              className="splash-video"
            >
              <source src={logoVideo} type="video/mp4" />
            </video>
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
        <div className="splash-version">SECURED PLATFORM v1.0.0</div>
      </div>
    </>
  );
}