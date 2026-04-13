import { useEffect, useState, Fragment } from "react";
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
    <div className="gl-page">
      <div className="gl-page-wide">

        {/* ── Header ── */}
        <div className="gl-header" style={{ marginBottom: 20 }}>
          <div>
            <div className="gl-title">Activity logs</div>
            <div className="gl-subtitle">
              {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
              {hasFilters ? " (filtered)" : ""}
            </div>
          </div>
          {hasFilters && (
            <button className="gl-btn gl-btn-ghost gl-btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="gl-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "flex-end" }}>
            <div className="gl-field">
              <label className="gl-label">Search</label>
              <div className="gl-search">
                <input
                  placeholder="Loan no, staff name, action…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 12, color: "var(--txt3)" }}>
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="gl-field">
              <label className="gl-label">Branch</label>
              <select className="gl-select" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                <option value="">All branches</option>
                {uniqueBranches.map((b, i) => <option key={i} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="gl-field">
              <label className="gl-label">From</label>
              <input type="date" className="gl-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            <div className="gl-field">
              <label className="gl-label">To</label>
              <input type="date" className="gl-input" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="gl-card" style={{ padding: 0, overflow: "hidden" }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--txt3)", fontSize: 14 }}>
              No activity records found.
            </div>
          ) : (
            <div className="gl-table-wrap" style={{ borderRadius: 0, border: "none" }}>
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>Staff</th>
                    <th>Branch</th>
                    <th>Action</th>
                    <th>Loan</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    // Fragment imported from react — supports key prop, no React global needed
                    <Fragment key={log.id}>
                      <tr>
                        <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--txt2)", whiteSpace: "nowrap" }}>
                          {new Date(log.created_at).toLocaleDateString("en-IN")}&nbsp;
                          <span style={{ color: "var(--txt3)" }}>
                            {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.name || "—"}</td>
                        <td style={{ color: "var(--txt2)" }}>{log.branch_name || "—"}</td>
                        <td style={{ maxWidth: 260, color: "var(--txt1)" }}>{log.action}</td>
                        <td>
                          {log.loan_id ? (
                            <Link
                              to={`/loan/${log.loan_id}`}
                              style={{ color: "var(--gold-dk)", fontWeight: 500, fontFamily: "var(--mono)", fontSize: 12 }}
                            >
                              {log.loan_number || `#${log.loan_id}`}
                            </Link>
                          ) : <span style={{ color: "var(--txt3)" }}>—</span>}
                        </td>
                        <td>
                          <button
                            className="gl-btn gl-btn-ghost gl-btn-sm"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          >
                            {expandedRow === log.id ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === log.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--gold-lt)", padding: "14px 16px", borderBottom: "0.5px solid var(--gold-border)" }}>
                            <div style={{ display: "flex", gap: 32, fontSize: 13, flexWrap: "wrap" }}>
                              <div><span style={{ color: "var(--txt2)" }}>Action: </span><strong>{log.action}</strong></div>
                              <div><span style={{ color: "var(--txt2)" }}>Staff: </span><strong>{log.name}</strong></div>
                              <div><span style={{ color: "var(--txt2)" }}>Branch: </span><strong>{log.branch_name}</strong></div>
                              <div>
                                <span style={{ color: "var(--txt2)" }}>Time: </span>
                                <strong>{new Date(log.created_at).toLocaleString("en-IN")}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

export default OwnerActivity;
