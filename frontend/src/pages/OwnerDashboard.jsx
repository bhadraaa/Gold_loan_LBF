import { useEffect, useState } from "react";
import "../styles/gl.css";
import api from "../axiosConfig";

function OwnerDashboard() {
  const token = sessionStorage.getItem("token");
  const name = sessionStorage.getItem("calling_name") || "owner";

  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [finance, setFinance] = useState(null);
  const [reportMsg, setReportMsg] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, branchRes, financeRes] = await Promise.all([
          api.get("/api/loans/owner/summary", { headers }),
          api.get("/api/loans/owner/branch-summary", { headers }),
          api.get("/api/loans/owner/finance-summary", { headers }),
        ]);
        setSummary(summaryRes.data);
        setBranches(branchRes.data);
        setFinance(financeRes.data);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };
    fetchAll();
  }, []);

  const fetchReport = async () => {
    if (!fromDate || !toDate) { setReportMsg("Select both dates."); return; }
    setReportMsg("");
    try {
      const res = await api.get(
        `/api/loans/owner/report?from=${fromDate}&to=${toDate}`, { headers }
      );
      setReportData(res.data);
      if (res.data.length === 0) setReportMsg("No records found for this period.");
    } catch (err) {
      setReportMsg("Failed to load report.");
    }
  };

  if (!summary) return (
    <div className="gl-loading"><span className="gl-spinner" />Loading dashboard…</div>
  );

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kpis = [
    { label: "Active loans", value: summary.activeLoans, icon: "📋", delta: null },
    { label: "Total gold", value: `${Number(summary.totalGold).toFixed(2)} g`, icon: "🪙", delta: null },
    { label: "Outstanding", value: `₹${Number(summary.totalOutstanding).toLocaleString("en-IN")}`, icon: "📊", delta: null },
    { label: "Today's collection", value: `₹${Number(summary.todayCollection).toLocaleString("en-IN")}`, icon: "💰", delta: "up" },
  ];

  return (
    <div className="gl-page">
      <div className="gl-page-wide">

        {/* ── Header ── */}
        <div className="gl-header" style={{ marginBottom: 32 }}>
          <div>
            <div className="gl-title" style={{ fontSize: 28 }}>{greet}, {name}</div>
            <div className="gl-subtitle" style={{ fontSize: 16, marginTop: 6 }}>Owner Dashboard</div>
          </div>
          <div style={{ fontSize: 14, color: "var(--txt3)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="gl-kpi-grid" style={{ marginBottom: 20 }}>
          {kpis.map(k => (
            <div className="gl-kpi" key={k.label}>
              <div className="gl-kpi-label">{k.label}</div>
              <div className="gl-kpi-value">{k.value}</div>
              {k.delta === "up" && <div className="gl-kpi-delta">↑ Today</div>}
            </div>
          ))}
        </div>

        {/* ── Finance Summary ── */}
        {finance && (
          <div className="gl-card" style={{ marginBottom: 20 }}>
            <div className="gl-section-label" style={{ marginBottom: 16 }}>Financial summary</div>
            <div className="gl-kpi-grid">
              {[
                { label: "Total interest earned", value: `₹${Number(finance.totalInterest).toLocaleString("en-IN")}`, color: "var(--success)" },
                { label: "Today's interest", value: `₹${Number(finance.todayInterest).toLocaleString("en-IN")}`, color: "var(--txt1)" },
                { label: "Monthly interest", value: `₹${Number(finance.monthlyInterest).toLocaleString("en-IN")}`, color: "var(--txt1)" },
                { label: "Total collection", value: `₹${Number(finance.totalCollection).toLocaleString("en-IN")}`, color: "var(--gold-dk)" },
              ].map(f => (
                <div className="gl-kpi" key={f.label}>
                  <div className="gl-kpi-label">{f.label}</div>
                  <div className="gl-kpi-value" style={{ color: f.color, fontSize: 18 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Branch Breakdown ── */}
        <div className="gl-card" style={{ marginBottom: 20 }}>
          <div className="gl-section-label" style={{ marginBottom: 16 }}>Branch breakdown</div>
          <div className="owner-branch-grid">
            {branches.map(branch => (
              <div className="owner-branch-card" key={branch.id}>
                <div className="owner-branch-name">{branch.name}</div>
                <div className="gl-detail-table" style={{ marginTop: 10 }}>
                  <div className="gl-row">
                    <span className="gl-row-key">Active loans</span>
                    <span className="gl-row-val">{branch.active_loans}</span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Total gold</span>
                    <span className="gl-row-val">{Number(branch.total_gold).toFixed(2)} g</span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Outstanding</span>
                    <span className="gl-row-val">₹{Number(branch.total_outstanding).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button
                  className="gl-btn gl-btn-outline gl-btn-sm gl-btn-full"
                  style={{ marginTop: 14 }}
                  onClick={() => window.open(`/api/loans/owner/export/${branch.id}`, "_blank")}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v7M3.5 5.5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Date Report ── */}
        <div className="gl-card" style={{ marginBottom: 32 }}>
          <div className="gl-section-label" style={{ marginBottom: 16 }}>Date report</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
            <div className="gl-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="gl-label">From</label>
              <input type="date" className="gl-input" value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate || undefined} />
            </div>
            <div className="gl-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="gl-label">To</label>
              <input type="date" className="gl-input" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate || undefined} />
            </div>
            <button className="gl-btn gl-btn-primary" onClick={fetchReport}>View report</button>
            <button
              className="gl-btn gl-btn-ghost"
              onClick={() => window.open(`/api/loans/owner/report/export?from=${fromDate}&to=${toDate}`, "_blank")}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v7M3.5 5.5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download CSV
            </button>
          </div>

          {reportMsg && (
            <div className="gl-alert gl-alert-warn" style={{ marginBottom: 12 }}>{reportMsg}</div>
          )}

          {reportData.length > 0 && (
            <div className="gl-table-wrap">
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Loan no.</th>
                    <th>Customer</th>
                    <th>Branch</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{row.loan_number}</td>
                      <td>{row.customer_name}</td>
                      <td>{row.branch}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>₹{Number(row.loan_amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`gl-badge ${row.status === "active" ? "gl-badge-active" :
                          row.status === "closed" ? "gl-badge-closed" :
                            row.status === "renewed" ? "gl-badge-renewed" : ""
                          }`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default OwnerDashboard;
