import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../axiosConfig";
import "../styles/gl.css";

const actions = [
  {
    id: "create-loan",
    path: "/create-loan",
    label: "New loan",
    desc: "Register a new gold loan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    accent: "var(--navy)",
    accentBg: "#EFF6FF",
    accentColor: "#1D4ED8",
  },
  {
    id: "search-loan",
    path: "/search-loan",
    label: "Search loan",
    desc: "Find by name, phone or loan no.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    accent: "#4F46E5",
    accentBg: "#EEF2FF",
    accentColor: "#4338CA",
  },
  {
    id: "payment",
    path: "/search-loan",
    label: "Payment",
    desc: "Record an interest or EMI payment",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 9h16" stroke="currentColor" strokeWidth="1.4" />
        <rect x="5" y="12" width="4" height="2" rx=".5" fill="currentColor" />
      </svg>
    ),
    accent: "var(--success)",
    accentBg: "var(--success-lt)",
    accentColor: "var(--success-dk)",
  },
  {
    id: "renewal",
    path: "/search-loan",
    label: "Renewal",
    desc: "Renew a loan term",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10a6 6 0 1110.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M14.5 3.5v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "var(--warn)",
    accentBg: "var(--warn-lt)",
    accentColor: "var(--warn-dk)",
  },
  {
    id: "topup",
    path: "/search-loan",
    label: "Top-up",
    desc: "Add extra loan amount",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    accent: "#7C3AED",
    accentBg: "#F5F3FF",
    accentColor: "#6D28D9",
  },
  {
    id: "summary",
    path: "/staff-summary",
    label: "Today summary",
    desc: "View daily collection report",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 14L7 9l4 3 5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "var(--gold)",
    accentBg: "var(--gold-lt)",
    accentColor: "var(--gold-dk)",
  },
];

function StaffDashboard() {
  const navigate = useNavigate();
  const Cname = sessionStorage.getItem("calling_name") || "Staff";
  const branchName = sessionStorage.getItem("branch") || "Main Branch";
  const [collection, setCollection] = useState("—");

  useEffect(() => {
    api.get("/api/loans/staff/today-summary")
      .then(res => setCollection(res.data.totalCollection || 0))
      .catch(console.error);
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="gl-page">
      <div className="gl-page-inner">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: "var(--txt1)", letterSpacing: "-.02em" }}>
            {greet}, {Cname}
          </div>
          <div style={{ fontSize: 16, color: "var(--txt2)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 4v7H1V4L6 1Z" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            {branchName} &nbsp;·&nbsp; {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="gl-stat-dark" style={{ marginBottom: 24 }}>
          <div>
            <div className="gl-stat-dark-label">Today's collection</div>
            <div className="gl-stat-dark-value">₹ {collection}</div>
          </div>
          <div className="gl-stat-dark-badge">Live</div>
        </div>

        {/* Action grid */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
            Quick actions
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {actions.map(a => (
              <button
                key={a.id}
                onClick={() => navigate(a.path)}
                style={{
                  background: "var(--surface)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "box-shadow .15s, transform .1s",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: a.accentBg,
                  color: a.accentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt1)" }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default StaffDashboard;
