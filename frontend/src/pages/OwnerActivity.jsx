import { useEffect, useState } from "react";
import "../styles/gl.css";
import { Link } from "react-router-dom";
import api from "../axiosConfig";

function OwnerActivity() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    api.get("/api/loans/owner/activity")
      .then(res => { setLogs(res.data); setFilteredLogs(res.data); })
      .catch(err => console.error("Activity fetch error:", err));
  }, []);

  const uniqueBranches = [...new Set(logs.map(l => l.branch_name).filter(Boolean))];

  useEffect(() => {
    let f = [...logs];
    if (search) f = f.filter(l =>
      l.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
    );
    if (branchFilter) f = f.filter(l => l.branch_name === branchFilter);
    if (fromDate) f = f.filter(l => new Date(l.created_at) >= new Date(fromDate));
    if (toDate) f = f.filter(l => new Date(l.created_at) <= new Date(toDate + "T23:59:59"));
    setFilteredLogs(f);
  }, [search, branchFilter, fromDate, toDate, logs]);

  const clearFilters = () => { setSearch(""); setBranchFilter(""); setFromDate(""); setToDate(""); };

  const hasFilters = search || branchFilter || fromDate || toDate;

  return (
    <div className="gl-page" style={{ background: "#FDFDFD" }}>
      <div className="gl-page-wide">

        {/* ── Header ── */}
        <div className="gl-header" style={{ marginBottom: 28, borderBottom: "1px solid #EEE", paddingBottom: 16 }}>
          <div>
            <div className="gl-title" style={{ fontFamily: "Playfair Display, serif", color: "#8B0000", fontSize: 28 }}>
              Activity Audit Logs
            </div>
            <div className="gl-subtitle" style={{ fontSize: 13, letterSpacing: 0.5, color: "#666" }}>
              Monitoring {filteredLogs.length} transaction records {hasFilters ? "(Filtered)" : ""}
            </div>
          </div>
          {hasFilters && (
            <button
              className="gl-btn gl-btn-ghost gl-btn-sm"
              onClick={clearFilters}
              style={{ color: "#8B0000", fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="gl-card" style={{ marginBottom: 24, border: "1px solid #EAEAEA", borderRadius: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 16, alignItems: "flex-end" }}>
            <div className="gl-field">
              <label className="gl-label" style={{ fontSize: 11, fontWeight: 700, color: "#999" }}>SEARCH RECORDS</label>
              <div className="gl-search" style={{ background: "#F9F9F9", border: "1px solid #DDD" }}>
                <input
                  placeholder="Loan, staff or action..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ background: "transparent" }}
                />
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 12, color: "#8B0000" }}>
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="gl-field">
              <label className="gl-label" style={{ fontSize: 11, fontWeight: 700, color: "#999" }}>BRANCH</label>
              <select className="gl-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                <option value="">All Locations</option>
                {uniqueBranches.map((b, i) => <option key={i} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="gl-field">
              <label className="gl-label" style={{ fontSize: 11, fontWeight: 700, color: "#999" }}>FROM</label>
              <input type="date" className="gl-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            <div className="gl-field">
              <label className="gl-label" style={{ fontSize: 11, fontWeight: 700, color: "#999" }}>TO</label>
              <input type="date" className="gl-input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="gl-card" style={{ padding: 0, overflow: "hidden", border: "1px solid #EEE", borderRadius: 12 }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 14 }}>No activity found for the selected criteria.</div>
            </div>
          ) : (
            <div className="gl-table-wrap" style={{ borderRadius: 0, border: "none" }}>
              <table className="gl-table">
                <thead>
                  <tr style={{ background: "#F8F8F8" }}>
                    <th style={{ color: "#8B0000" }}>Timestamp</th>
                    <th>Executive</th>
                    <th>Branch</th>
                    <th>Action Detail</th>
                    <th>Reference</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <React.Fragment key={log.id}>
                      <tr style={{ borderBottom: "1px solid #F5F5F5" }}>
                        <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 12, color: "#555" }}>
                          <span style={{ fontWeight: 600 }}>{new Date(log.created_at).toLocaleDateString("en-IN")}</span>
                          <br />
                          <span style={{ color: "#999", fontSize: 11 }}>
                            {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#1A1A1A" }}>{log.name || "—"}</td>
                        <td style={{ color: "#666", fontSize: 13 }}>{log.branch_name || "—"}</td>
                        <td style={{ maxWidth: 300, color: "#333", fontSize: 13 }}>{log.action}</td>
                        <td>
                          {log.loan_id ? (
                            <Link
                              to={`/loan/${log.loan_id}`}
                              style={{
                                color: "#8B0000",
                                fontWeight: 600,
                                fontSize: 12,
                                textDecoration: "none",
                                borderBottom: "1px dashed #8B0000"
                              }}
                            >
                              {log.loan_number || `#${log.loan_id}`}
                            </Link>
                          ) : <span style={{ color: "#BBB" }}>—</span>}
                        </td>
                        <td>
                          <button
                            className="gl-btn gl-btn-ghost gl-btn-sm"
                            style={{
                              padding: "4px 12px",
                              fontSize: 11,
                              borderRadius: 4,
                              color: expandedRow === log.id ? "#8B0000" : "#666",
                              background: expandedRow === log.id ? "rgba(139,0,0,0.05)" : "transparent"
                            }}
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          >
                            {expandedRow === log.id ? "CLOSE" : "DETAILS"}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === log.id && (
                        <tr key={`${log.id}-exp`}>
                          <td colSpan="6" style={{ background: "#FAF9F8", padding: "20px", borderBottom: "2px solid #8B0000" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "#999", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Full Description</label>
                                <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{log.action}</span>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "#999", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Responsible Staff</label>
                                <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{log.name} ({log.branch_name})</span>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 10, color: "#999", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Exact Time</label>
                                <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{new Date(log.created_at).toLocaleString("en-IN", { dateStyle: 'full', timeStyle: 'short' })}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.4, fontSize: 10, letterSpacing: 1.5 }}>
        LAKSHMI BHADRA ADITHI • AUDIT SYSTEM
      </div>
    </div>
  );
}

export default OwnerActivity;