import { useEffect, useState } from "react";
import "../styles/gl.css";
import api from "../axiosConfig";
import { Link } from "react-router-dom";

function TermOverLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await api.get("/api/loans/term-over");
        setLoans(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  if (loading) return <div className="gl-loading"><span className="gl-spinner" />Searching records...</div>;

  return (
    <div className="gl-page">
      <div className="gl-page-wide">
        <div className="gl-header">
          <div>
            <div className="gl-title">Term over loans</div>
            <div className="gl-subtitle">Loans exceeding the 6-month term</div>
          </div>
          <span className="gl-badge gl-badge-closed">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 3v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Overdue
          </span>
        </div>

        <div className="gl-card" style={{ padding: 0, overflow: "hidden" }}>
          {loans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--txt3)" }}>
              No overdue loans found.
            </div>
          ) : (
            <div className="gl-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="gl-table">
                <thead>
                  <tr>
                    <th>Loan No</th>
                    <th>Customer</th>
                    <th>Start Date</th>
                    <th>Principal</th>
                    <th>Remaining</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id} style={{ background: "var(--err-lt)" }}>
                      <td style={{ fontFamily: "var(--mono)", fontWeight: 500 }}>{loan.loan_number}</td>
                      <td style={{ fontWeight: 500 }}>{loan.customer_name}</td>
                      <td>{new Date(loan.created_at).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>₹{Number(loan.loan_amount).toLocaleString("en-IN")}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--err-dk)", fontWeight: 600 }}>
                        ₹{Number(loan.remaining_principal).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <Link to={`/loan/${loan.id}`} className="gl-btn gl-btn-ghost gl-btn-sm" style={{ padding: "4px 10px" }}>
                          View details
                        </Link>
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

export default TermOverLoans;
