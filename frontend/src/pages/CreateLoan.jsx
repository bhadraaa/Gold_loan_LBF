import { useState, useEffect } from "react";
import api from "../axiosConfig";
import "../styles/gl.css";

function CreateLoan() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loanNumber, setLoanNumber] = useState("");
  const [items, setItems] = useState([{ name: "", weight: "" }]);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDate, setLoanDate] = useState("");
  const [manualInterestRate, setManualInterestRate] = useState("");
  const [goldRate, setGoldRate] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/loans/gold-rate")
      .then(res => setGoldRate(Number(res.data?.gold_rate) || 0))
      .catch(() => setGoldRate(0));
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { name: "", weight: "" }]);
  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ name: "", weight: "" }]);
  };

  const totalWeight = items.reduce((s, i) => s + Number(i.weight || 0), 0);
  const eligibleAmount = totalWeight * goldRate;
  const interestPreview = loanAmount && manualInterestRate
    ? ((Number(loanAmount) * Number(manualInterestRate)) / 100 / 12).toFixed(2)
    : null;

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);

    if (!loanNumber.trim()) {
      setMessage("Loan number is required."); setIsError(true); return;
    }
    if (!customerName || !phone || !address) {
      setMessage("All customer fields are required."); setIsError(true); return;
    }
    if (items.some(i => !i.name || Number(i.weight) <= 0)) {
      setMessage("Each gold item needs a name and valid weight."); setIsError(true); return;
    }
    if (!loanAmount || Number(loanAmount) <= 0) {
      setMessage("Enter a valid loan amount."); setIsError(true); return;
    }
    if (manualInterestRate !== "") {
      const rate = Number(manualInterestRate);
      if (rate < 0 || rate >= 60) {
        setMessage("Interest rate must be between 0% and 59.99%."); setIsError(true); return;
      }
    }

    setLoading(true);
    try {
      await api.post("/api/loans/create", {
        loan_number: loanNumber.trim(),
        customer_name: customerName,
        phone,
        address,
        items,
        loan_amount: Number(loanAmount),
        custom_rate: manualInterestRate !== "" ? Number(manualInterestRate) : null,
        loan_date: loanDate || null   // 🔥 ADD HERE
      });
      setMessage("Loan created successfully!");
      setIsError(false);
      setLoanNumber(""); setCustomerName(""); setPhone(""); setAddress("");
      setItems([{ name: "", weight: "" }]);
      setLoanAmount(""); setManualInterestRate("");
      setLoanDate("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create loan.");
      setIsError(true);
    }
    setLoading(false);
  };

  return (
    <div className="gl-page">
      <div className="gl-page-inner">

        {/* Header */}
        <div className="gl-header">
          <div>
            <div className="gl-title">New loan</div>
            <div className="gl-subtitle">Register a gold-backed loan</div>
          </div>
          {goldRate > 0 && (
            <div className="gl-badge gl-badge-gold" style={{ fontSize: 13 }}>
              ₹{goldRate.toLocaleString("en-IN")}/g
            </div>
          )}
        </div>

        {/* Alert */}
        {message && (
          <div className={`gl-alert ${isError ? "gl-alert-error" : "gl-alert-success"}`} style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              {isError
                ? <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>
                : <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>
              }
            </svg>
            {message}
          </div>
        )}

        {/* ── Loan Number ── */}
        <div className="gl-card" style={{ marginBottom: 16 }}>
          <div className="gl-field">
            <label className="gl-label">Loan number</label>
            <input
              className="gl-input"
              placeholder="e.g. BR1-LOAN-101"
              value={loanNumber}
              onChange={e => setLoanNumber(e.target.value)}
              style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".02em" }}
            />
          </div>
        </div>

        {/* ── Customer ── */}
        <div className="gl-card gl-gap-16" style={{ marginBottom: 16 }}>
          <div className="gl-section-label">Customer</div>

          <div className="gl-field">
            <label className="gl-label">Full name</label>
            <input className="gl-input" placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>

          <div className="gl-field">
            <label className="gl-label">Phone</label>
            <input className="gl-input" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="gl-field">
            <label className="gl-label">Address</label>
            <textarea className="gl-textarea" placeholder="Full address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>

        {/* ── Gold Items ── */}
        <div className="gl-card gl-gap-12" style={{ marginBottom: 16 }}>
          <div className="gl-section-label">Gold items</div>

          {items.map((item, index) => (
            <div key={index} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div className="gl-field" style={{ flex: 1 }}>
                {index === 0 && <label className="gl-label">Item</label>}
                <input
                  className="gl-input"
                  placeholder="e.g. Necklace, Ring"
                  value={item.name}
                  onChange={e => handleItemChange(index, "name", e.target.value)}
                />
              </div>
              <div className="gl-field" style={{ width: 100 }}>
                {index === 0 && <label className="gl-label">Weight (g)</label>}
                <input
                  className="gl-input"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={item.weight}
                  onChange={e => handleItemChange(index, "weight", e.target.value)}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    background: "var(--err-lt)", color: "var(--err)",
                    border: "0.5px solid #FCA5A5",
                    borderRadius: "var(--radius-xs)",
                    width: 36, height: 38, flexShrink: 0,
                    cursor: "pointer", fontSize: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              )}
            </div>
          ))}

          <button
            onClick={addItem}
            style={{
              background: "none", border: "none", color: "var(--gold-dk)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add item
          </button>

          {/* Weight / eligible preview */}
          <div style={{
            background: "var(--bg)", border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: "12px 16px",
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 2 }}>Total weight</div>
              <div style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{totalWeight.toFixed(2)} g</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 2 }}>Gold rate</div>
              <div style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>₹{goldRate.toLocaleString("en-IN")}/g</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 2 }}>Eligible amount</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gold-dk)", fontVariantNumeric: "tabular-nums" }}>
                ₹{eligibleAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* ── Loan Details ── */}
        <div className="gl-card gl-gap-16" style={{ marginBottom: 20 }}>
          <div className="gl-section-label">Loan details</div>
          <div className="gl-field">
            <label className="gl-label">Loan Date</label>
            <input
              className="gl-input"
              type="date"
              value={loanDate}
              onChange={e => setLoanDate(e.target.value)}
            />
          </div>
          <div className="gl-field">
            <label className="gl-label">Loan amount (₹)</label>
            <input
              className="gl-input"
              type="number"
              min="0"
              placeholder="0"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              style={{ fontVariantNumeric: "tabular-nums", fontSize: 16 }}
            />
          </div>

          {/* Custom interest */}
          <div>
            <label className="gl-label">Custom interest rate % <span style={{ color: "var(--txt3)", fontWeight: 400 }}>(optional — leave blank for slab rate)</span></label>
            <input
              className="gl-input"
              type="number"
              min="0"
              max="59.99"
              step="0.01"
              placeholder="e.g. 18"
              value={manualInterestRate}
              onChange={e => setManualInterestRate(e.target.value)}
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
            {interestPreview && (
              <div style={{ fontSize: 12, color: "var(--gold-dk)", marginTop: 6 }}>
                Monthly interest: <strong>₹{Number(interestPreview).toLocaleString("en-IN")}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          className="gl-btn gl-btn-primary gl-btn-full gl-btn-lg"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginBottom: 32 }}
        >
          {loading
            ? <><span className="gl-spinner" style={{ borderTopColor: "#fff" }} /> Creating…</>
            : "Create loan"
          }
        </button>

      </div>
    </div>
  );
}

export default CreateLoan;
