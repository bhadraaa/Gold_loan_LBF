import { useEffect, useState } from "react";
import "../styles/gl.css";
import api from "../axiosConfig";

function OwnerDashboard() {
  const token = sessionStorage.getItem("token");
  const name = sessionStorage.getItem("calling_name") || "Owner";

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
    if (!fromDate || !toDate) {
      setReportMsg("Select both dates.");
      return;
    }
    setReportMsg("");
    try {
      const res = await api.get(
        `/api/loans/owner/report?from=${fromDate}&to=${toDate}`,
        { headers }
      );
      setReportData(res.data);
      if (res.data.length === 0) setReportMsg("No records found for this period.");
    } catch (err) {
      setReportMsg("Failed to load report.");
    }
  };

  if (!summary)
    return (
      <div className="gl-loading">
        <span className="gl-spinner" style={{ borderTopColor: "#8B0000" }} />
        <p style={{ color: "#8B0000", fontWeight: 500 }}>Initializing Dashboard...</p>
      </div>
    );

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Updated KPI Config with Brand Colors
  const kpis = [
    { label: "Active Loans", value: summary.activeLoans, sub: "Live Accounts" },
    { label: "Total Gold", value: `${Number(summary.totalGold).toFixed(2)} g`, sub: "Vault Weight" },
    { label: "Outstanding", value: `₹${Number(summary.totalOutstanding).toLocaleString("en-IN")}`, sub: "Principal Value" },
    { label: "Today's Collection", value: `₹${Number(summary.todayCollection).toLocaleString("en-IN")}`, sub: "Daily Inflow", delta: "up" },
  ];

  return (
    <div className="gl-page" style={{ background: "#F9F9F9" }}>
      <div className="gl-page-wide">

        {/* ── Header ── */}
        <div className="gl-header" style={{ marginBottom: 40, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
          <div>
            <div className="gl-title" style={{ fontFamily: "Playfair Display, serif", fontSize: 32, color: "var(--txt1)" }}>
              {greet}, <span style={{ color: "var(--navy)" }}>{name}</span>
            </div>
            <div className="gl-subtitle" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 2, color: "var(--txt2)", fontWeight: 600 }}>
              Lakshmi Bhadra Adithi Financiers • Executive Portal
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--txt1)" }}>
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: 12, color: "var(--txt2)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</div>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="gl-kpi-grid" style={{ marginBottom: 24 }}>
          {kpis.map((k) => (
            <div className="gl-kpi" key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <div className="gl-kpi-label" style={{ color: "var(--txt2)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{k.label}</div>
              <div className="gl-kpi-value" style={{ color: "var(--navy)", fontSize: 26, margin: "4px 0" }}>{k.value}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--txt3)" }}>{k.sub}</span>
                {k.delta === "up" && (
                  <span style={{ fontSize: 11, color: "var(--success-dk, #2E7D32)", background: "var(--success-lt, #E8F5E9)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                    ↑ TRENDING
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Financial Summary ── */}
        {finance && (
          <div className="gl-card" style={{ marginBottom: 24, borderLeft: "4px solid var(--navy)" }}>
            <div className="gl-section-label" style={{ color: "var(--txt1)", fontWeight: 700 }}>Financial Performance</div>
            <div className="gl-kpi-grid" style={{ marginTop: 20 }}>
              {[
                { label: "Total Interest Earned", value: `₹${Number(finance.totalInterest).toLocaleString("en-IN")}`, color: "var(--navy)" },
                { label: "Today's Interest", value: `₹${Number(finance.todayInterest).toLocaleString("en-IN")}`, color: "var(--txt1)" },
                { label: "Monthly Interest", value: `₹${Number(finance.monthlyInterest).toLocaleString("en-IN")}`, color: "var(--txt1)" },
                { label: "Total Collection", value: `₹${Number(finance.totalCollection).toLocaleString("en-IN")}`, color: "var(--gold-dk)" },
              ].map((f) => (
                <div className="gl-kpi" key={f.label} style={{ background: "transparent", border: "none", padding: 0 }}>
                  <div className="gl-kpi-label" style={{ fontSize: 11, color: "var(--txt2)" }}>{f.label}</div>
                  <div className="gl-kpi-value" style={{ color: f.color, fontSize: 20 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Branch Breakdown ── */}
        <div className="gl-card" style={{ marginBottom: 24 }}>
          <div className="gl-section-label">Branch Asset Distribution</div>
          <div className="owner-branch-grid" style={{ marginTop: 20 }}>
            {branches.map((branch) => (
              <div className="owner-branch-card" key={branch.id} style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                <div className="owner-branch-name" style={{ color: "var(--navy)", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                  {branch.name}
                </div>
                <div className="gl-detail-table" style={{ marginTop: 12 }}>
                  <div className="gl-row">
                    <span className="gl-row-key">Active Loans</span>
                    <span className="gl-row-val" style={{ color: "var(--txt1)", fontWeight: 600 }}>{branch.active_loans}</span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Total Gold</span>
                    <span className="gl-row-val">{Number(branch.total_gold).toFixed(2)} g</span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Outstanding</span>
                    <span className="gl-row-val" style={{ color: "var(--navy)" }}>₹{Number(branch.total_outstanding).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <button
                  className="gl-btn gl-btn-outline gl-btn-sm gl-btn-full"
                  style={{ marginTop: 16, borderColor: "var(--border-md)", color: "var(--txt2)" }}
                  onClick={() => window.open(`/api/loans/owner/export/${branch.id}`, "_blank")}
                >
                  Export CSV Report
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Date Report ── */}
        <div className="gl-card">
          <div className="gl-section-label">Custom Audit Report</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", margin: "20px 0" }}>
            <div className="gl-field" style={{ flex: 1, minWidth: 160 }}>
              <label className="gl-label">From Date</label>
              <input type="date" className="gl-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={toDate || undefined} />
            </div>
            <div className="gl-field" style={{ flex: 1, minWidth: 160 }}>
              <label className="gl-label">To Date</label>
              <input type="date" className="gl-input" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate || undefined} />
            </div>
            <button className="gl-btn" style={{ background: "var(--navy)", color: "#FFF" }} onClick={fetchReport}>
              Generate Report
            </button>
            <button
              className="gl-btn gl-btn-ghost"
              style={{ color: "var(--navy)" }}
              onClick={() => window.open(`/api/loans/owner/report/export?from=${fromDate}&to=${toDate}`, "_blank")}
            >
              Download CSV
            </button>
          </div>

          {reportMsg && <div className="gl-alert gl-alert-warn">{reportMsg}</div>}

          {reportData.length > 0 && (
            <div className="gl-table-wrap" style={{ borderRadius: 8, border: "1px solid var(--border)" }}>
              <table className="gl-table">
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    <th style={{ color: "var(--navy)" }}>Loan No.</th>
                    <th>Customer Name</th>
                    <th>Branch</th>
                    <th>Principal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: "var(--txt1)" }}>{row.loan_number}</td>
                      <td style={{ fontWeight: 500 }}>{row.customer_name}</td>
                      <td>{row.branch}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(row.loan_amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span
                          className={`gl-badge ${row.status === "active" ? "gl-badge-active" : ""}`}
                          style={row.status === 'active' ? { background: 'var(--navy)', color: '#FFF' } : {}}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Security Tag */}
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--txt3)", fontSize: 11, letterSpacing: 1 }}>
        SECURED OWNER ACCESS • LAKSHMI BHADRA ADITHI FINANCIERS v1.0.4
      </div>
    </div>
  );
}

export default OwnerDashboard;