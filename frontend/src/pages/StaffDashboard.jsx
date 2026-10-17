import { useState, useEffect } from "react";
import api from "../axiosConfig";
import { actions } from "./dashboardActions";
import ActionCard from "./ActionCard";
import "../styles/gl.css";

// Helpers ------------------------------------------------------------
const getGreeting = (hour) =>
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

const formatDate = (date) =>
  date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

// Styles -------------------------------------------------------------
const styles = {
  header: { marginBottom: 32 },
  greeting: { fontSize: 28, fontWeight: 600, color: "var(--txt1)", letterSpacing: "-.02em" },
  subtitle: { fontSize: 16, color: "var(--txt2)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 },
  stat: { marginBottom: 24 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
};

// Small components ---------------------------------------------------
function Header({ name, branch, now }) {
  return (
    <div style={styles.header}>
      <div style={styles.greeting}>
        {getGreeting(now.getHours())}, {name}
      </div>
      <div style={styles.subtitle}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L11 4v7H1V4L6 1Z" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        {branch} &nbsp;·&nbsp; {formatDate(now)}
      </div>
    </div>
  );
}

function CollectionStat({ value }) {
  return (
    <div className="gl-stat-dark" style={styles.stat}>
      <div>
        <div className="gl-stat-dark-label">Today's collection</div>
        <div className="gl-stat-dark-value">₹ {value}</div>
      </div>
      <div className="gl-stat-dark-badge">Live</div>
    </div>
  );
}

// Page ---------------------------------------------------------------
function StaffDashboard() {
  const name = sessionStorage.getItem("calling_name") || "Staff";
  const branch = sessionStorage.getItem("branch") || "Main Branch";
  const [collection, setCollection] = useState("—");

  useEffect(() => {
    api
      .get("/api/loans/staff/today-summary")
      .then((res) => setCollection(res.data.totalCollection || 0))
      .catch(console.error);
  }, []);

  return (
    <div className="gl-page">
      <div className="gl-page-inner">
        <Header name={name} branch={branch} now={new Date()} />
        <CollectionStat value={collection} />

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Quick actions</div>
          <div style={styles.grid}>
            {actions.map(({ id, ...action }) => (
              <ActionCard key={id} {...action} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default StaffDashboard;
