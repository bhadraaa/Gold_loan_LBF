import { useEffect, useState } from "react";
import "../styles/gl.css";
import api from "../axiosConfig";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useNavigate } from "react-router-dom";

function StaffSummary() {
  const [data, setData] = useState(null);
  const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const navigate = useNavigate();
const today = getLocalDateString(new Date());

const [fromDate, setFromDate] = useState(today);
const [toDate, setToDate] = useState(today);

  const [loading, setLoading] = useState(true);

  const fetchSummary = async (from, to) => {
  setLoading(true);

  try {
    const res = await api.get(
      `/api/loans/staff/date-summary?from=${from}&to=${to}`
    );
    setData(res.data);
  } catch (err) {
    console.error("Failed to fetch staff summary:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  fetchSummary(fromDate, toDate);
}, []);

  if (!data && loading) return <div className="gl-loading"><span className="gl-spinner" />Loading summary...</div>;
  if (!data) return null;

  const kpis = [
    { label: "Loans created", value: data.totalLoans, color: "var(--txt1)" },
    { label: "Total collection", value: `₹${Number(data.totalCollection).toLocaleString("en-IN")}`, color: "var(--success)" },
    { label: "Interest earned", value: `₹${Number(data.totalInterest).toLocaleString("en-IN")}`, color: "var(--txt1)" },
    { label: "Principal collected", value: `₹${Number(data.totalPrincipal).toLocaleString("en-IN")}`, color: "var(--txt1)" },
  ];

  return (
    <div className="gl-page">
      <div className="gl-page-wide">

        <div className="gl-header">
          <div>
            <div className="gl-title">Daily summary</div>
            <div className="gl-subtitle">Financial breakdown for selected dates</div>
          </div>
          <div
  style={{
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-end",
  }}
>
  <div className="gl-field">
    <label className="gl-label">From Date</label>
    <Flatpickr
      className="gl-input custom-big-calendar"
      value={fromDate ? new Date(`${fromDate}T12:00:00`) : null}
      onChange={([date]) => {
        if (!date) return;

        const formatted = getLocalDateString(date);
        setFromDate(formatted);
        fetchSummary(formatted, toDate);
      }}
      options={{
        dateFormat: "d-m-Y",
        allowInput: false,
      }}
    />
  </div>

  <div className="gl-field">
    <label className="gl-label">To Date</label>
    <Flatpickr
      className="gl-input custom-big-calendar"
      value={toDate ? new Date(`${toDate}T12:00:00`) : null}
      onChange={([date]) => {
        if (!date) return;

        const formatted = getLocalDateString(date);
        setToDate(formatted);
        fetchSummary(fromDate, formatted);
      }}
      options={{
        dateFormat: "d-m-Y",
        allowInput: false,
        minDate: fromDate || undefined,
      }}
    />
  </div>
</div>
        </div>

        <div className="gl-card" style={{ marginBottom: 24 }}>
          <div className="gl-section-label">Summary Overview</div>
          <div className="gl-kpi-grid">
            {kpis.map(k => (
              <div className="gl-kpi" key={k.label}>
                <div className="gl-kpi-label">{k.label}</div>
                <div className="gl-kpi-value" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gl-row-2" style={{ alignItems: "flex-start" }}>
          <div className="gl-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px" }}>
              <div className="gl-section-label" style={{ margin: 0 }}>Loans Created</div>
            </div>
            <div className="gl-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Loan No</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.loans.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--txt3)", padding: 24 }}>No loans created</td></tr>
                  ) : (
                    data.loans.map((loan) => (
                      <tr key={loan.id}>
                        <td style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{loan.loan_number}</td>
                        <td style={{ fontWeight: 500 }}>{loan.customer_name}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>₹{Number(loan.loan_amount).toLocaleString("en-IN")}</td>
                        <td style={{ color: "var(--txt2)" }}>{new Date(loan.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>
                          <button
                            type="button"
                            className="gl-btn gl-btn-outline gl-btn-sm"
                            onClick={() => navigate(`/loan/${loan.id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="gl-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px" }}>
              <div className="gl-section-label" style={{ margin: 0 }}>Payments Received</div>
            </div>
            <div className="gl-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Loan No</th>
                    <th>Amount</th>
                    <th>Interest / Principal</th>
                    <th>Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--txt3)", padding: 24 }}>No payments received</td></tr>
                  ) : (
                    data.payments.map((pay, index) => (
                      <tr key={index}>
                        <td style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{pay.loan_number}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--success)", fontWeight: 600 }}>₹{Number(pay.amount_paid).toLocaleString("en-IN")}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                            ₹{Number(pay.interest_paid).toLocaleString("en-IN")} / ₹{Number(pay.principal_paid).toLocaleString("en-IN")}
                        </td>
                        <td style={{ color: "var(--txt2)" }}>{new Date(pay.payment_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>
                          <button
                            type="button"
                            className="gl-btn gl-btn-outline gl-btn-sm"
                            onClick={() => navigate(`/loan/${pay.loan_id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StaffSummary;
