import { useEffect, useState } from "react";
import "../styles/gl.css";
import api from "../axiosConfig";

function GoldRateSettings() {
  const [currentRate, setCurrentRate] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [updating, setUpdating] = useState(false);

  const fetchRate = async () => {
    try {
      const res = await api.get("/api/loans/gold-rate");
      setCurrentRate(res.data);
    } catch {
      setMsg({ text: "Failed to fetch gold rate.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRate(); }, []);

  const handleUpdate = async () => {
    if (!newRate || Number(newRate) <= 0) {
      setMsg({ text: "Enter a valid rate.", ok: false }); return;
    }
    setUpdating(true); setMsg({ text: "", ok: false });
    try {
      await api.post("/api/loans/owner/set-gold-rate", { gold_rate: Number(newRate) });
      setMsg({ text: "Gold rate updated successfully.", ok: true });
      setNewRate("");
      fetchRate();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Update failed.", ok: false });
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="gl-loading"><span className="gl-spinner" />Loading gold rate…</div>
  );

  return (
    <div className="gl-page">
      <div className="gl-page-inner">

        {/* Header */}
        <div className="gl-header">
          <div>
            <div className="gl-title">Gold rate</div>
            <div className="gl-subtitle">Set the current market rate per gram</div>
          </div>
          <span className="gl-badge gl-badge-gold">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polygon points="6,1 7.5,4.3 11,4.8 8.6,7.1 9.2,10.6 6,9 2.8,10.6 3.4,7.1 1,4.8 4.5,4.3"
                stroke="currentColor" strokeWidth=".9" fill="none" />
            </svg>
            Live rate
          </span>
        </div>

        {/* Alert */}
        {msg.text && (
          <div className={`gl-alert ${msg.ok ? "gl-alert-success" : "gl-alert-error"}`} style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              {msg.ok
                ? <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>
                : <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></>
              }
            </svg>
            {msg.text}
          </div>
        )}

        {/* Current rate card */}
        {currentRate && (
          <div className="gl-stat-dark" style={{ marginBottom: 16 }}>
            <div>
              <div className="gl-stat-dark-label">Current gold rate</div>
              <div className="gl-stat-dark-value">
                ₹{Number(currentRate.gold_rate).toLocaleString("en-IN")}
                <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 6, opacity: .7 }}>/g</span>
              </div>
              <div style={{ fontSize: 11, color: "#5A7A65", marginTop: 6 }}>
                Effective from {new Date(currentRate.effective_from).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="gl-stat-dark-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <polygon points="7,1 8.5,4.8 12.5,5.3 9.8,7.9 10.5,12 7,10 3.5,12 4.2,7.9 1.5,5.3 5.5,4.8"
                  stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
              Active
            </div>
          </div>
        )}

        {/* Update card */}
        <div className="gl-card">
          <div className="gl-section-label" style={{ marginBottom: 16 }}>Update rate</div>

          <div className="gl-field" style={{ marginBottom: 16 }}>
            <label className="gl-label">New rate (₹ per gram)</label>
            <input
              type="number"
              className="gl-input"
              placeholder="e.g. 6500"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              min="0"
              style={{ fontVariantNumeric: "tabular-nums", fontSize: 16 }}
              onKeyDown={e => e.key === "Enter" && handleUpdate()}
            />
          </div>

          {/* Preview */}
          {newRate && Number(newRate) > 0 && currentRate && (
            <div style={{
              background: "var(--bg)", border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-xs)", padding: "10px 14px",
              marginBottom: 16, fontSize: 13,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--txt2)" }}>
                <span>Previous rate</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>₹{Number(currentRate.gold_rate).toLocaleString("en-IN")}/g</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "var(--txt1)", fontWeight: 500 }}>
                <span>New rate</span>
                <span style={{
                  fontVariantNumeric: "tabular-nums",
                  color: Number(newRate) > Number(currentRate.gold_rate) ? "var(--success)" : "var(--err)"
                }}>
                  ₹{Number(newRate).toLocaleString("en-IN")}/g
                  {Number(newRate) > Number(currentRate.gold_rate) ? " ↑" : " ↓"}
                </span>
              </div>
            </div>
          )}

          <button
            className="gl-btn gl-btn-gold gl-btn-full gl-btn-lg"
            onClick={handleUpdate}
            disabled={updating || !newRate || Number(newRate) <= 0}
          >
            {updating
              ? <><span className="gl-spinner" style={{ borderTopColor: "#fff" }} />Updating…</>
              : <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 2v3M7.5 10v3M2 7.5h3M10 7.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                Update gold rate
              </>
            }
          </button>

          <div className="gl-alert gl-alert-warn" style={{ marginTop: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4.5v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Updating the rate affects eligible amount calculations for all new loans created after this point.
          </div>
        </div>

      </div>
    </div>
  );
}

export default GoldRateSettings;
