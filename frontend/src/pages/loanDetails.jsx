import { useEffect, useState } from "react";
import api from "../axiosConfig";
import { useParams } from "react-router-dom";
import "../styles/gl.css";

function LoanDetails() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [interestData, setInterestData] = useState(null);
  const [renewedLoan, setRenewedLoan] = useState(null);

  // Payment section state
  const [paymentType, setPaymentType] = useState("installment"); // "installment" | "interest"
  const [payAmount, setPayAmount] = useState("");
  const [payMsg, setPayMsg] = useState({ text: "", ok: false });

  // Close loan state
  const [closeMsg, setCloseMsg] = useState({ text: "", ok: false });
  const [closeConfirm, setCloseConfirm] = useState(false);

  // Renew state
  const [renewMsg, setRenewMsg] = useState({ text: "", ok: false });
  const [renewConfirm, setRenewConfirm] = useState(false);

  // Top-up state
  const [extraAmount, setExtraAmount] = useState("");
  const [topupMsg, setTopupMsg] = useState({ text: "", ok: false });

  const fetchLoanData = async () => {
    try {
      const res = await api.get(`/api/loans/${id}`);
      setLoan(res.data);
      const payRes = await api.get(`/api/loans/${id}/payments`);
      setPayments(payRes.data);
    } catch (err) {
      console.error(err.response?.data);
    }
  };

  const fetchInterest = async () => {
    try {
      const res = await api.get(`/api/loans/${id}/interest`);
      setInterestData(res.data);
    } catch { }
  };

  const fetchRenewedLoan = async () => {
    try {
      const res = await api.get(`/api/loans/${id}/renewed-loan`);
      setRenewedLoan(res.data);
    } catch {
      setRenewedLoan(null);
    }
  };

  useEffect(() => {
    fetchLoanData();
    fetchInterest();
    const iv = setInterval(fetchInterest, 60000);
    return () => clearInterval(iv);
  }, [id]);

  useEffect(() => {
    if (loan?.status === "renewed") fetchRenewedLoan();
  }, [loan?.status]);

  // ── Payment (installment or interest) ──
  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      setPayMsg({ text: "Enter a valid amount.", ok: false });
      return;
    }
    try {
      const res = await api.post(`/api/loans/${id}/payment`, {
        amount_paid: Number(payAmount),
        payment_type: paymentType,
      });
      setPayMsg({
        text: `Payment recorded — Interest: ₹${res.data.interestPaid} · Principal: ₹${res.data.principalPaid}`,
        ok: true,
      });
      setPayAmount("");
      fetchLoanData();
      fetchInterest();
    } catch (err) {
      setPayMsg({ text: err.response?.data?.message || "Payment failed.", ok: false });
    }
  };

  // ── Close loan — uses totalPayable calculated from interestData ──
  const handleClose = async () => {
    try {
      const res = await api.post(`/api/loans/${id}/payment`, {
        amount_paid: totalPayable,
        payment_type: "close",
      });
      setCloseMsg({
        text: `Loan closed. Interest: ₹${res.data.interestPaid} · Principal: ₹${res.data.principalPaid}`,
        ok: true,
      });
      setCloseConfirm(false);
      fetchLoanData();
      fetchInterest();
    } catch (err) {
      setCloseMsg({ text: err.response?.data?.message || "Close failed.", ok: false });
    }
  };

  // ── Renew ──
  const [renewLoanNumber, setRenewLoanNumber] = useState("");

  const handleRenew = async () => {
    if (!renewLoanNumber.trim()) {
      setRenewMsg({ text: "Please provide a new loan number.", ok: false });
      return;
    }
    try {
      const res = await api.post(`/api/loans/${id}/renew`, { new_loan_number: renewLoanNumber });
      window.location.href = `/loan/${res.data.newLoan.id}`;
    } catch (err) {
      setRenewMsg({ text: err.response?.data?.message || "Renewal failed.", ok: false });
    }
  };

  // ── Top-up ──
  const handleTopUp = async () => {
    if (!extraAmount || Number(extraAmount) <= 0) {
      setTopupMsg({ text: "Enter a valid top-up amount.", ok: false });
      return;
    }
    try {
      await api.post(`/api/loans/${id}/topup`, { extra_amount: Number(extraAmount) });
      setTopupMsg({ text: "Top-up added successfully.", ok: true });
      setExtraAmount("");
      fetchLoanData();
      fetchInterest();
    } catch (err) {
      setTopupMsg({ text: err.response?.data?.message || "Top-up failed.", ok: false });
    }
  };

  if (!loan) return (
    <div className="gl-loading">
      <span className="gl-spinner" />
      Loading loan details…
    </div>
  );

  const isClosed = loan.status === "closed";
  const isRenewed = loan.status === "renewed";
  const isActive = loan.status === "active";

  const items = loan.items || [];
  const totalGoldWeight = items.reduce((s, i) => s + parseFloat(i.weight || 0), 0);
  const isOverdue = interestData?.days > 90;
  const totalPayable = interestData ? interestData.remainingPrincipal + interestData.interest : 0;

  const badgeClass = isClosed ? "gl-badge-closed" : isRenewed ? "gl-badge-renewed" : "gl-badge-active";
  const badgeLabel = isClosed ? "Closed" : isRenewed ? "Renewed" : "Active";

  return (
    <div className="gl-page">
      <style>{`
        .action-tabs {
          display: flex;
          gap: 0;
          border: 1px solid var(--border-md);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-bottom: 16px;
        }
        .action-tab {
          flex: 1;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font);
          cursor: pointer;
          border: none;
          background: var(--bg);
          color: var(--txt2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border-right: 1px solid var(--border-md);
          transition: background .15s, color .15s;
        }
        .action-tab:last-child { border-right: none; }
        .action-tab.selected-installment { background: #1A3C2B; color: #FFFDF7; }
        .action-tab.selected-interest    { background: #C8962A; color: #FFFDF7; }
        .action-tab:hover:not(.selected-installment):not(.selected-interest) {
          background: var(--surface);
          color: var(--txt1);
        }
        .action-tab svg { opacity: .7; }
        .action-tab.selected-installment svg,
        .action-tab.selected-interest svg { opacity: 1; }
        .action-tab-label { font-size: 11px; }

        .pay-type-hint {
          font-size: 12px;
          color: var(--txt2);
          background: var(--bg);
          border: 0.5px solid var(--border);
          border-radius: var(--radius-xs);
          padding: 9px 12px;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .action-section {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-bottom: 12px;
        }
        .action-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--bg);
          border-bottom: 0.5px solid var(--border);
          cursor: default;
          user-select: none;
        }
        .action-section-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .action-section-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .action-section-title { font-size: 13px; font-weight: 600; color: var(--txt1); }
        .action-section-sub   { font-size: 11px; color: var(--txt2); margin-top: 1px; }
        .action-section-body  { padding: 16px; background: var(--surface); }

        .section-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0 16px;
        }
        .section-divider-line { flex: 1; height: 1px; background: var(--border); }
        .section-divider-text {
          font-size: 10px;
          font-weight: 500;
          color: var(--txt3);
          text-transform: uppercase;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .confirm-box {
          background: #FEF3C7;
          border: 1px solid #FCD34D;
          border-radius: var(--radius-xs);
          padding: 12px 14px;
          margin-top: 10px;
          font-size: 13px;
          color: #7A4E0D;
        }
        .confirm-box strong { display: block; margin-bottom: 8px; font-size: 13px; }
        .confirm-actions { display: flex; gap: 8px; margin-top: 8px; }

        .renew-confirm-box {
          background: #FEF3C7;
          border: 1px solid #FCD34D;
          border-radius: var(--radius-xs);
          padding: 14px;
          margin-top: 12px;
          font-size: 13px;
          color: #7A4E0D;
        }

        /* Close summary box */
        .close-summary {
          background: #FEF2F2;
          border: 0.5px solid #FECACA;
          border-radius: var(--radius-xs);
          padding: 12px 14px;
          margin-bottom: 14px;
        }
        .close-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--txt2);
          margin-bottom: 6px;
        }
        .close-summary-row:last-child { margin-bottom: 0; }
        .close-summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          font-weight: 600;
          color: #991B1B;
          padding-top: 8px;
          margin-top: 8px;
          border-top: 0.5px solid #FECACA;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 600px) {
          .action-tab-label { display: none; }
          .action-tab { padding: 10px 4px; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--txt1)", letterSpacing: "-.02em" }}>
              Loan details
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--txt2)", background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 6, padding: "2px 8px" }}>
                {loan.loan_number}
              </span>
              <span className={`gl-badge ${badgeClass}`}>{badgeLabel}</span>
              {isOverdue && isActive && (
                <span className="gl-badge" style={{ background: "var(--warn-lt)", color: "var(--warn-dk)" }}>Overdue</span>
              )}
            </div>
          </div>
          <button className="gl-btn gl-btn-ghost gl-btn-sm no-print" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5V2h8v3" stroke="currentColor" strokeWidth="1.2" />
              <rect x="1" y="5" width="12" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 9h8M3 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Print receipt
          </button>
        </div>

        {/* Banners */}
        {isRenewed && renewedLoan && (
          <div className="gl-alert gl-alert-warn" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <path d="M3 8a5 5 0 1 0 8.7-3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M11.5 3L12.5 5.5 10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              This loan has been renewed. &nbsp;
              <a href={`/loan/${renewedLoan.id}`} style={{ fontWeight: 500, color: "var(--warn-dk)", textDecoration: "underline" }}>
                View new loan #{renewedLoan.loan_number}
              </a>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="gl-alert gl-alert-error" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <div>
              <strong>Loan fully settled.</strong> Complete payment received
              {loan.closed_at && ` on ${new Date(loan.closed_on).toLocaleDateString("en-IN")}`}.
            </div>
          </div>
        )}

        {/* ── Customer + Gold grid ── */}
        <div className="gl-row-2" style={{ marginBottom: 16 }}>
          <div className="gl-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Customer</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid var(--border)" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
                {loan.customer_name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--txt1)" }}>{loan.customer_name}</div>
                <div style={{ fontSize: 12, color: "var(--txt2)" }}>{loan.phone}</div>
              </div>
            </div>
            <div className="gl-gap-8">
              <div style={{ fontSize: 12, color: "var(--txt2)" }}>Address</div>
              <div style={{ fontSize: 13, color: "var(--txt1)" }}>{loan.address}</div>
            </div>
          </div>

          <div className="gl-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Gold items</div>
            <div className="gl-gap-8" style={{ marginBottom: 14 }}>
              {items.map((item, i) => (
                <div key={i} className="gl-gold-item">
                  <span className="gl-gold-item-name">{item.name}</span>
                  <span className="gl-gold-item-weight">{item.weight}g</span>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--gold-lt)", border: "0.5px solid var(--gold-border)", borderRadius: "var(--radius-xs)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--gold-dk)" }}>Total weight</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--gold-dk)", fontVariantNumeric: "tabular-nums" }}>{totalGoldWeight.toFixed(2)} g</span>
            </div>
          </div>
        </div>

        {/* ── Financial summary ── */}
        <div className="gl-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 16 }}>Financial summary</div>
          {interestData ? (
            <>
              <div className={`gl-payable${isOverdue ? " overdue" : ""}`} style={{ marginBottom: 16 }}>
                <div className="gl-payable-label">Total payable today</div>
                <div className="gl-payable-amount">₹{totalPayable.toLocaleString("en-IN")}</div>
                <div className="gl-payable-sub">
                  Principal ₹{interestData.remainingPrincipal?.toLocaleString("en-IN")} + Interest ₹{interestData.interest?.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="gl-kpi-grid">
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Base amount</div>
                  <div className="gl-kpi-value">₹{Number(loan.loan_amount).toLocaleString("en-IN")}</div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Interest rate</div>
                  <div className="gl-kpi-value">{loan.interest_rate || 12}%</div>
                  <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 2 }}>{loan.custom_interest_rate != null ? "Custom" : "Slab-based"}</div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Days running</div>
                  <div className="gl-kpi-value" style={{ color: isOverdue ? "var(--err)" : "var(--txt1)" }}>{interestData.days}d</div>
                </div>
                <div className="gl-kpi">
                  <div className="gl-kpi-label">Total paid</div>
                  <div className="gl-kpi-value" style={{ color: "var(--success)" }}>₹{(loan.total_paid || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>
              {Number(loan.total_principal) > Number(loan.loan_amount) && (
                <div className="gl-alert gl-alert-info" style={{ marginTop: 12 }}>
                  Top-up included: <strong>+₹{(Number(loan.total_principal) - Number(loan.loan_amount)).toLocaleString("en-IN")}</strong>
                  &nbsp;· Total principal: <strong>₹{Number(loan.total_principal).toLocaleString("en-IN")}</strong>
                </div>
              )}
            </>
          ) : (
            <div className="gl-loading" style={{ minHeight: 100 }}>
              <span className="gl-spinner" /> Calculating interest…
            </div>
          )}
        </div>

        {/* ── Loan info ── */}
        <div className="gl-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>Loan info</div>
          <div className="gl-detail-table">
            <div className="gl-row"><span className="gl-row-key">Loan no.</span><span className="gl-row-val" style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{loan.loan_number}</span></div>
            <div className="gl-row"><span className="gl-row-key">Branch</span><span className="gl-row-val">{loan.branch || "BR1"}</span></div>
            <div className="gl-row"><span className="gl-row-key">Created</span><span className="gl-row-val">{new Date(loan.created_at).toLocaleDateString("en-IN")}</span></div>
            <div className="gl-row"><span className="gl-row-key">Loan type</span><span className="gl-row-val">{loan.loan_type === "special" ? "Special" : "Normal"}</span></div>
            {isClosed && loan.closed_on && (
              <div className="gl-row"><span className="gl-row-key">Closed on</span><span className="gl-row-val">{new Date(loan.closed_on).toLocaleDateString("en-IN")}</span></div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            ACTIONS — active loans only
        ════════════════════════════════════════ */}
        {isActive && interestData && (
          <div className="gl-card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 20 }}>
              Actions
            </div>

            {/* ── SECTION 1: Make a payment ── */}
            <div className="action-section">
              <div className="action-section-header">
                <div className="action-section-header-left">
                  <div className="action-section-icon" style={{ background: "#E6F4EC" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="#1B5235" strokeWidth="1.3" />
                      <path d="M1 7h14" stroke="#1B5235" strokeWidth="1.3" />
                      <circle cx="5" cy="10" r="1" fill="#1B5235" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-section-title">Make a payment</div>
                    <div className="action-section-sub">Pay as installment or interest only</div>
                  </div>
                </div>
              </div>

              <div className="action-section-body">
                {/* Payment type tabs */}
                <div className="action-tabs">
                  <button
                    className={`action-tab${paymentType === "installment" ? " selected-installment" : ""}`}
                    onClick={() => { setPaymentType("installment"); setPayMsg({ text: "", ok: false }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="action-tab-label">Installment</span>
                  </button>
                  <button
                    className={`action-tab${paymentType === "interest" ? " selected-interest" : ""}`}
                    onClick={() => { setPaymentType("interest"); setPayMsg({ text: "", ok: false }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="5.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4 12L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span className="action-tab-label">Interest only</span>
                  </button>
                </div>

                {/* Hint text */}
                <div className="pay-type-hint">
                  {paymentType === "installment"
                    ? "💳 Installment — amount will be applied to outstanding interest first, then to the principal balance."
                    : "📊 Interest only — amount covers accrued interest. Principal balance remains unchanged."}
                </div>

                {payMsg.text && (
                  <div className={`gl-alert ${payMsg.ok ? "gl-alert-success" : "gl-alert-error"}`} style={{ marginBottom: 12 }}>
                    {payMsg.text}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    type="number"
                    className="gl-input"
                    placeholder={
                      paymentType === "interest"
                        ? `₹${interestData.interest?.toLocaleString("en-IN")} (interest due)`
                        : "Enter amount"
                    }
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    style={{ width: "100%", fontVariantNumeric: "tabular-nums" }}
                  />
                  <button
                    className="gl-btn gl-btn-primary"
                    style={{ width: "100%", background: paymentType === "interest" ? "var(--gold)" : "var(--navy)" }}
                    onClick={handlePayment}
                  >
                    {paymentType === "installment" ? "Pay installment" : "Pay interest"}
                  </button>
                </div>

                {/* Quick fill for interest */}
                {paymentType === "interest" && interestData?.interest > 0 && (
                  <button
                    className="gl-btn gl-btn-ghost gl-btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => setPayAmount(String(interestData.interest))}
                  >
                    Fill exact interest amount (₹{interestData.interest?.toLocaleString("en-IN")})
                  </button>
                )}
              </div>
            </div>

            {/* ── SECTION 2: Top-up ── */}
            <div className="action-section">
              <div className="action-section-header">
                <div className="action-section-header-left">
                  <div className="action-section-icon" style={{ background: "#EFF6FF" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#1D4ED8" strokeWidth="1.3" />
                      <path d="M8 5v6M5 8h6" stroke="#1D4ED8" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-section-title">Top-up loan</div>
                    <div className="action-section-sub">Add extra amount to principal</div>
                  </div>
                </div>
              </div>
              <div className="action-section-body">
                {topupMsg.text && (
                  <div className={`gl-alert ${topupMsg.ok ? "gl-alert-success" : "gl-alert-error"}`} style={{ marginBottom: 12 }}>
                    {topupMsg.text}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    type="number"
                    className="gl-input"
                    placeholder="Top-up amount (₹)"
                    value={extraAmount}
                    onChange={e => setExtraAmount(e.target.value)}
                    style={{ width: "100%", fontVariantNumeric: "tabular-nums" }}
                  />
                  <button className="gl-btn gl-btn-outline" style={{ width: "100%" }} onClick={handleTopUp}>
                    Add top-up
                  </button>
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="section-divider">
              <div className="section-divider-line" />
              <span className="section-divider-text">Loan lifecycle</span>
              <div className="section-divider-line" />
            </div>

            {/* ── SECTION 3: Close loan ── */}
            <div className="action-section" style={{ borderColor: "#FECACA" }}>
              <div className="action-section-header" style={{ background: "#FEF2F2", borderBottomColor: "#FECACA" }}>
                <div className="action-section-header-left">
                  <div className="action-section-icon" style={{ background: "#FEE2E2" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#991B1B" strokeWidth="1.3" />
                      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#991B1B" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-section-title" style={{ color: "#991B1B" }}>Close loan</div>
                    <div className="action-section-sub">Full settlement — gold will be released</div>
                  </div>
                </div>
                <span className="gl-badge gl-badge-closed">Final</span>
              </div>

              <div className="action-section-body">
                {closeMsg.text && (
                  <div className={`gl-alert ${closeMsg.ok ? "gl-alert-success" : "gl-alert-error"}`} style={{ marginBottom: 12 }}>
                    {closeMsg.text}
                  </div>
                )}

                {/* Settlement breakdown — read-only, calculated from interestData */}
                <div className="close-summary">
                  <div className="close-summary-row">
                    <span>Remaining principal</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>₹{interestData.remainingPrincipal?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="close-summary-row">
                    <span>Interest accrued ({interestData.days} days)</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>₹{interestData.interest?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="close-summary-total">
                    <span>Total settlement amount</span>
                    <span>₹{totalPayable.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {!closeConfirm ? (
                  <button
                    className="gl-btn gl-btn-full"
                    style={{ background: "#DC2626", color: "#fff" }}
                    onClick={() => setCloseConfirm(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    Close loan · ₹{totalPayable.toLocaleString("en-IN")}
                  </button>
                ) : (
                  <div className="confirm-box">
                    <strong>⚠️ Confirm loan closure</strong>
                    Closing with <strong style={{ fontVariantNumeric: "tabular-nums" }}>₹{totalPayable.toLocaleString("en-IN")}</strong> (principal + interest as of today).
                    This will mark the loan as fully settled and release the gold. This cannot be undone.
                    <div className="confirm-actions">
                      <button className="gl-btn gl-btn-sm" style={{ background: "#DC2626", color: "#fff" }} onClick={handleClose}>
                        Yes, close loan
                      </button>
                      <button className="gl-btn gl-btn-ghost gl-btn-sm" onClick={() => setCloseConfirm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 4: Renew loan ── */}
            <div className="action-section" style={{ borderColor: "#FDE68A" }}>
              <div className="action-section-header" style={{ background: "#FFFBEB", borderBottomColor: "#FDE68A" }}>
                <div className="action-section-header-left">
                  <div className="action-section-icon" style={{ background: "#FEF3C7" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8a5 5 0 1 0 8.7-3.3" stroke="#92400E" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M11.5 3L12.5 5.5 10 5" stroke="#92400E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-section-title" style={{ color: "#92400E" }}>Renew loan</div>
                    <div className="action-section-sub">Carry forward as a fresh loan, same gold</div>
                  </div>
                </div>
                <span className="gl-badge gl-badge-renewed">New term</span>
              </div>

              <div className="action-section-body">
                {renewMsg.text && (
                  <div className={`gl-alert ${renewMsg.ok ? "gl-alert-success" : "gl-alert-error"}`} style={{ marginBottom: 12 }}>
                    {renewMsg.text}
                  </div>
                )}

                <div style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 12 }}>
                  Renewing will close this loan and create a new one with the remaining principal as the new loan amount. Interest accrued so far must be settled separately.
                </div>

                <div style={{ background: "var(--warn-lt)", border: "0.5px solid var(--gold-border)", borderRadius: "var(--radius-xs)", padding: "10px 14px", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--warn-dk)", display: "flex", justifyContent: "space-between" }}>
                    <span>Remaining principal (new loan amount)</span>
                    <strong style={{ fontVariantNumeric: "tabular-nums" }}>₹{interestData.remainingPrincipal?.toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                {!renewConfirm ? (
                  <button
                    className="gl-btn gl-btn-warn gl-btn-full"
                    onClick={() => setRenewConfirm(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 7.5A4.5 4.5 0 1 0 11.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M11.5 2v2.5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Renew this loan
                  </button>
                ) : (
                  <div className="renew-confirm-box">
                    <strong style={{ display: "block", marginBottom: 6 }}>⚠️ Confirm renewal</strong>
                    A new loan of <strong>₹{interestData.remainingPrincipal?.toLocaleString("en-IN")}</strong> will be created. This loan will be marked as renewed.
                    <div className="gl-field" style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 13, marginBottom: 4 }}>New Loan Number</label>
                      <input 
                        className="gl-input" 
                        value={renewLoanNumber} 
                        onChange={(e) => setRenewLoanNumber(e.target.value)} 
                        placeholder="Enter new loan number"
                        style={{ padding: "8px 12px" }}
                      />
                    </div>
                    <div className="confirm-actions" style={{ marginTop: 10 }}>
                      <button className="gl-btn gl-btn-sm gl-btn-warn" onClick={handleRenew}>
                        Yes, renew loan
                      </button>
                      <button className="gl-btn gl-btn-ghost gl-btn-sm" onClick={() => { setRenewConfirm(false); setRenewLoanNumber(""); setRenewMsg({ text: "", ok: false }); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── Payment history ── */}
        <div className="gl-card" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--txt2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 16 }}>
            Payment history
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--txt3)", fontSize: 14 }}>
              No payments recorded yet.
            </div>
          ) : (
            <div className="gl-table-wrap">
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount paid</th>
                    <th>Interest</th>
                    <th>Principal</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay, i) => (
                    <tr key={i}>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {new Date(pay.payment_date).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        {pay.payment_type === "interest" ? (
                          <span className="gl-badge gl-badge-gold">Interest</span>
                        ) : pay.payment_type === "close" ? (
                          <span className="gl-badge gl-badge-closed">Close</span>
                        ) : (
                          <span className="gl-badge gl-badge-active">Installment</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>
                        ₹{pay.amount_paid?.toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: "var(--txt2)", fontVariantNumeric: "tabular-nums" }}>₹{pay.interest_paid}</td>
                      <td style={{ color: "var(--txt2)", fontVariantNumeric: "tabular-nums" }}>₹{pay.principal_paid}</td>
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

export default LoanDetails;
