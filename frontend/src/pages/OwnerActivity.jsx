import { useEffect, useState, Fragment } from "react";
import "../styles/gl.css";
import { Link } from "react-router-dom";
import api from "../axiosConfig";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function OwnerLoanDetails({ loanId, onClose }) {
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const [loanRes, paymentRes, interestRes] =
          await Promise.all([
            api.get(`/api/loans/${loanId}`),
            api.get(`/api/loans/${loanId}/payments`),
            api.get(`/api/loans/${loanId}/interest`).catch(() => null),
          ]);
          console.log("Loan details API response:", loanRes.data);

        if (cancelled) return;

        setLoan(loanRes.data);
        setPayments(paymentRes.data || []);
        setInterest(interestRes?.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            "Unable to load this loan. Check owner access permissions."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [loanId]);

  const money = value =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const date = value =>
    value ? new Date(value).toLocaleDateString("en-IN") : "—";

  const items = loan?.items || [];
  const totalWeight = items.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0
  );

  const remainingPrincipal = Number(
    interest?.remainingPrincipal ?? loan?.loan_amount ?? 0
  );
  const interestDue = Number(interest?.interest || 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.60)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Full loan details"
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg, #fff)",
          width: "100%",
          maxWidth: 1000,
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <div className="gl-title">Full Loan Details</div>
            <div className="gl-subtitle">
              Read-only view · Loan #{loanId}
            </div>
          </div>

          <button
            type="button"
            className="gl-btn gl-btn-ghost"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>

        {loading ? (
          <div className="gl-loading">
            <span className="gl-spinner" />
            Loading loan details…
          </div>
        ) : error ? (
          <div className="gl-alert gl-alert-error">{error}</div>
        ) : loan ? (
          <>
            <div
              className="gl-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <div className="gl-label">Loan Number</div>
                <h2 style={{ margin: "6px 0" }}>
                  {loan.loan_number || `#${loan.id}`}
                </h2>
                <span
                  className={`gl-badge ${
                    loan.status === "closed"
                      ? "gl-badge-closed"
                      : loan.status === "renewed"
                      ? "gl-badge-renewed"
                      : "gl-badge-active"
                  }`}
                >
                  {loan.status || "Unknown"}
                </span>
              </div>

              <div>
                <div className="gl-label">Principal Amount</div>
                <h2 style={{ margin: "6px 0" }}>
                  {money(loan.loan_amount)}
                </h2>
                <div className="gl-subtitle">
                  Created {date(loan.created_at)}
                </div>
              </div>
            </div>

            <div className="gl-row-2" style={{ marginBottom: 16 }}>
              <div className="gl-card">
                <div className="gl-section-label">Customer Details</div>
                <div style={{ marginTop: 14 }}>
                  <strong>{loan.customer_name || "—"}</strong>
                  <p>{loan.phone || "No phone available"}</p>
                  <p>{loan.address || "No address available"}</p>
                </div>
              </div>

              <div className="gl-card">
                <div className="gl-section-label">Loan Information</div>
                <div className="gl-detail-table" style={{ marginTop: 12 }}>
                  <div className="gl-row">
                    <span className="gl-row-key">Branch</span>
                    <span className="gl-row-val">
                      {loan.branch || loan.branch_name || "—"}
                    </span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Loan type</span>
                    <span className="gl-row-val">
                      {loan.loan_type || "Normal"}
                    </span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Interest rate</span>
                    <span className="gl-row-val">
                      {loan.interest_rate ?? "—"}%
                    </span>
                  </div>
                  <div className="gl-row">
                    <span className="gl-row-key">Closed date</span>
                    <span className="gl-row-val">
                      {date(loan.closed_on)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="gl-card" style={{ marginBottom: 16 }}>
              <div className="gl-section-label">Gold Items</div>

              {items.length ? items.map((item, index) => (
                <div className="gl-gold-item" key={item.id || index}>
                  <span className="gl-gold-item-name">
                    {item.name || "Gold item"}
                  </span>
                  <span className="gl-gold-item-weight">
                    {item.weight || 0} g
                  </span>
                </div>
              )) : (
                <p>No gold item details available.</p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 14,
                  padding: 12,
                  background: "var(--gold-lt)",
                  borderRadius: 8,
                }}
              >
                <strong>Total Gold Weight</strong>
                <strong>{totalWeight.toFixed(2)} g</strong>
              </div>
            </div>

            <div className="gl-card" style={{ marginBottom: 16 }}>
              <div className="gl-section-label">
                Financial Summary
              </div>

              <div className="gl-kpi-grid" style={{ marginTop: 16 }}>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Loan Amount</div>
                  <div className="gl-kpi-value">
                    {money(loan.loan_amount)}
                  </div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Total Paid</div>
                  <div className="gl-kpi-value">
                    {money(loan.total_paid)}
                  </div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Remaining Principal</div>
                  <div className="gl-kpi-value">
                    {money(remainingPrincipal)}
                  </div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Interest Due</div>
                  <div className="gl-kpi-value">
                    {money(interestDue)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 10,
                  background: "var(--navy)",
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Total Payable (based on current interest API)
                </div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>
                  {money(remainingPrincipal + interestDue)}
                </div>
              </div>
            </div>

            <div className="gl-card">
              <div className="gl-section-label">
                Payment History ({payments.length})
              </div>

              {payments.length === 0 ? (
                <p style={{ padding: 12 }}>No payments recorded.</p>
              ) : (
                <div className="gl-table-wrap">
                  <table className="gl-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Interest</th>
                        <th>Principal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr key={payment.id || index}>
                          <td>{date(payment.payment_date)}</td>
                          <td>{payment.payment_type || "Installment"}</td>
                          <td>{money(payment.amount_paid)}</td>
                          <td>{money(payment.interest_paid)}</td>
                          <td>{money(payment.principal_paid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}


function OwnerActivity() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [allBranches, setAllBranches] = useState([]);

  useEffect(() => {
    api.get("/api/loans/owner/activity")
      .then(res => { setLogs(res.data); setFilteredLogs(res.data); })
      .catch(err => console.error("Activity fetch error:", err));

    api.get("/api/branches")
      .then(res => setAllBranches(res.data))
      .catch(err => console.error("Branch fetch error:", err));
  }, []);

  useEffect(() => {
    let f = [...logs];
    if (search) f = f.filter(l =>
      l.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
    );
    if (branchFilter) {
      f = f.filter(
        l => String(l.branch_id) === String(branchFilter)
      );
    }
      if (fromDate) {
        f = f.filter(
          l => formatLocalDate(new Date(l.created_at)) >= fromDate
        );
      }

      if (toDate) {
        f = f.filter(
          l => formatLocalDate(new Date(l.created_at)) <= toDate
        );
      }
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
              <select
                className="gl-select"
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
              >
                <option value="">All branches</option>

                {allBranches.map(b => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="gl-field">
              <label className="gl-label">From</label>
              
              <Flatpickr
                className="gl-input custom-big-calendar"
                value={parseLocalDate(fromDate)}
                onChange={([date]) => {
                  setFromDate(date ? formatLocalDate(date) : "");
                }}
                options={{
                  dateFormat: "d-m-Y",
                  allowInput: false,
                }}
              />
            </div>

            <div className="gl-field">
              <label className="gl-label">To</label>
              <Flatpickr
              className="gl-input custom-big-calendar"
              value={parseLocalDate(toDate)}
              onChange={([date]) => {
                setToDate(date ? formatLocalDate(date) : "");
              }}
              options={{
                dateFormat: "d-m-Y",
                allowInput: false,
              }}
            />
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
                              style={{ color: "var(--gold-dk)", fontWeight: 500, fontFamily: "var(--mono)", fontSize:16 }}
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
                            <div style={{ display: "flex", gap: 32, fontSize: 16, flexWrap: "wrap" }}>
                              <div><span style={{ color: "var(--txt2)" }}>Action: </span><strong>{log.action}</strong></div>
                              <div><span style={{ color: "var(--txt2)" }}>Staff: </span><strong>{log.name}</strong></div>
                              <div><span style={{ color: "var(--txt2)" }}>Branch: </span><strong>{log.branch_name}</strong></div>
                              <div>
                                <span style={{ color: "var(--txt2)" }}>Time: </span>
                                <strong>{new Date(log.created_at).toLocaleString("en-IN")}</strong>
                              </div>
                              <button
                                type="button"
                                className="gl-btn gl-btn-outline gl-btn-sm"
                                onClick={() => setSelectedLoanId(log.loan_id)}
                              >
                                View Full Loan Details
                              </button>
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
      {selectedLoanId && (
        <OwnerLoanDetails
          loanId={selectedLoanId}
          onClose={() => setSelectedLoanId(null)}
        />
      )}
    </div>
  );
}

export default OwnerActivity;
