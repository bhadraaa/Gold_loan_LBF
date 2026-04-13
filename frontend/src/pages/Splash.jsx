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
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .splash-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 1;
          width: 100%;
        }

        /* Rectangular Video Container (Wide width, shorter height) */
        .video-box {
          width: 330px;          /* Wider width */
          height: 370px;         /* Shorter height */
          border-radius: 12px;   /* Rounded corners for modern look */
          overflow: hidden;
          background: #F8F8F8;
          box-shadow: 0 10px 30px rgba(139, 0, 0, 0.08);
          margin-bottom: 30px;
          position: relative;
          animation: logo-pop 0.8s ease-out;
        }

        /* Cropping & Zooming Logic */
        .splash-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Adjust scale and Y position to center your specific logo perfectly */
        
          transform: scale(1.6) translateY(14%);
          transition: transform 0.5s ease;
        }

        @keyframes logo-pop {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .brand-primary {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #8B0000;
          margin: 0;
          line-height: 1.2;
        }

        .brand-secondary {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #1A1A1A;
          letter-spacing: 5px;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .splash-tagline {
          font-size: 12px;
          font-weight: 500;
          color: #5C1A1A;
          letter-spacing: .2em;
          text-transform: uppercase;
          margin-top: 18px;
          opacity: 0.6;
        }

        .splash-dots {
          display: flex;
          gap: 12px;
          margin-top: 35px;
        }

        .splash-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #8B0000;
          animation: splash-dot-pulse 1.2s ease-in-out infinite;
        }
        .splash-dot:nth-child(2) { animation-delay: .2s; }
        .splash-dot:nth-child(3) { animation-delay: .4s; }

        @keyframes splash-dot-pulse {
          0%, 100% { opacity: .2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        .splash-version {
          position: absolute;
          bottom: 24px;
          font-size: 10px;
          color: #BBB;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="splash-root">
        <div className="splash-center">
          <div className="video-box">
            <video autoPlay muted playsInline className="splash-video">
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
        <div className="splash-version">SECURED PORTAL v1.0.0</div>
      </div>
    </>
  );
}