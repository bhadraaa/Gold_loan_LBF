
import { useCallback, useEffect, useState } from "react";
import api from "../axiosConfig";

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
  background: "#FFFFFF",
  color: "#222222",
};

const primaryButton = {
  padding: "11px 18px",
  border: "none",
  borderRadius: 8,
  background: "#8B0000",
  color: "#FFFFFF",
  fontWeight: 600,
  cursor: "pointer",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function CashTransactions() {
  const role = sessionStorage.getItem("role");
  const isOwner = role === "owner";

  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [branchId, setBranchId] = useState(
    sessionStorage.getItem("active_branch_id") || ""
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [recipientId, setRecipientId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [cashSummary, setCashSummary] = useState({
    total_cash_given: 0,
    total_cash_returned: 0,
    outstanding_cash: 0,
    transaction_count: 0,
    });

const [summaryLoading, setSummaryLoading] = useState(true);
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (isOwner && branchId) params.branch_id = branchId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get("/api/cash-transactions", {
        params,
      });

      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load cash transactions."
      );
    } finally {
      setLoading(false);
    }
  }, [isOwner, branchId, startDate, endDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!isOwner) return;

    api
      .get("/api/branches")
      .then((response) => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.branches || [];

        setBranches(data);
      })
      .catch(() => {
        setError("Unable to load branches.");
      });
  }, [isOwner]);
  useEffect(() => {
  if (!isOwner || !branchId) {
    setStaffMembers([]);
    setRecipientId("");
    return;
  }

  let cancelled = false;

  const loadStaff = async () => {
    setStaffLoading(true);

    try {
      const response = await api.get("/api/cash-transactions/staff", {
        params: { branch_id: branchId },
      });

      if (!cancelled) {
        setStaffMembers(response.data.staff || []);
        setRecipientId("");
      }
    } catch (err) {
      if (!cancelled) {
        setStaffMembers([]);
        setRecipientId("");
        setError(
          err.response?.data?.message || "Unable to load branch staff."
        );
      }
    } finally {
      if (!cancelled) setStaffLoading(false);
    }
  };

  loadStaff();

  return () => {
    cancelled = true;
  };
}, [isOwner, branchId]);
const loadCashSummary = useCallback(async () => {
  setSummaryLoading(true);

  try {
    const params = {};

    if (isOwner && branchId) {
      params.branch_id = branchId;
    }

    const response = await api.get("/api/cash-transactions/summary", {
      params,
    });

    setCashSummary(response.data);
  } catch (err) {
    console.error("Failed to load cash summary:", err);
    setError(
      err.response?.data?.message || "Unable to load cash summary."
    );
  } finally {
    setSummaryLoading(false);
  }
}, [isOwner, branchId]);
useEffect(() => {
  loadCashSummary();
}, [loadCashSummary]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (isOwner && !branchId) {
      setError("Please select a branch.");
      return;
    }

    const payload = {
      transaction_type: isOwner ? "CASH_GIVEN" : "CASH_RETURNED",
      amount: Number(amount),
      transaction_date: transactionDate,
      notes: notes.trim(),
    };

    if (isOwner) {
      payload.branch_id = Number(branchId);

      if (recipientId.trim()) {
        payload.to_user_id = Number(recipientId);
      }
    }

    setSaving(true);

    try {
      await api.post("/api/cash-transactions", payload);

      setSuccess("Cash transaction recorded successfully.");
      
      setAmount("");
      setRecipientId("");
      setNotes("");

      await loadTransactions();
      await loadCashSummary();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to record the transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, color: "#1A1A1A", marginBottom: 8 }}>
          Cash Transactions
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>
          Record cash movements and track branch-wise cash history.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            marginBottom: 16,
            background: "#FEF2F2",
            color: "#B91C1C",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: 12,
            marginBottom: 16,
            background: "#F0FDF4",
            color: "#166534",
            borderRadius: 8,
          }}
        >
          {success}
        </div>
      )}

      <section
        style={{
          background: "#FFFFFF",
          padding: 24,
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 20, color: "#222222" }}>
          {isOwner ? "Record Cash Given" : "Record Cash Returned"}
        </h2>
        
        <div
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16,
            marginBottom: 24,
        }}
        >
        {[
            {
            label: "Total Cash Given",
            value: cashSummary.total_cash_given,
            color: "#8B0000",
            },
            {
            label: "Total Cash Returned",
            value: cashSummary.total_cash_returned,
            color: "#166534",
            },
            {
            label: "Outstanding Cash",
            value: cashSummary.outstanding_cash,
            color: "#1D4ED8",
            },
        ].map((item) => (
            <div
            key={item.label}
            style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 22,
                borderTop: `4px solid ${item.color}`,
            }}
            >
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 12 }}>
                {item.label}
            </p>

            <h2 style={{ color: item.color, fontSize: 25 }}>
                {summaryLoading ? "Loading..." : money(item.value)}
            </h2>
            </div>
        ))}
        </div>


        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {isOwner && (
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Branch *
                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  required
                  style={{ ...inputStyle, marginTop: 7 }}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Amount (₹) *
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                required
                style={{ ...inputStyle, marginTop: 7 }}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Transaction date *
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                required
                style={{ ...inputStyle, marginTop: 7 }}
              />
            </label>

            {isOwner && (
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Handed over to staff (optional)
                <select
                    value={recipientId}
                    onChange={(event) => setRecipientId(event.target.value)}
                    disabled={!branchId || staffLoading}
                    style={{ ...inputStyle, marginTop: 7 }}
                >
                    <option value="">
                    {staffLoading ? "Loading staff..." : "Select staff member"}
                    </option>

                    {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                        {staff.calling_name || staff.name}
                    </option>
                    ))}
                </select>
                </label>
            )}

            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                gridColumn: "1 / -1",
              }}
            >
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add transaction details (optional)"
                rows={3}
                style={{
                  ...inputStyle,
                  marginTop: 7,
                  resize: "vertical",
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...primaryButton,
              marginTop: 20,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : isOwner
              ? "Record Cash Given"
              : "Record Cash Returned"}
          </button>
        </form>
      </section>

      <section
        style={{
          background: "#FFFFFF",
          padding: 24,
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 18, color: "#222222" }}>
          Transaction History
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {isOwner && (
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Filter by branch
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                style={{ ...inputStyle, marginTop: 7 }}
              >
                <option value="">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            From date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              style={{ ...inputStyle, marginTop: 7 }}
            />
          </label>

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            To date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              style={{ ...inputStyle, marginTop: 7 }}
            />
          </label>

          <button
            type="button"
            onClick={loadTransactions}
            style={{ ...primaryButton, alignSelf: "end" }}
          >
            Refresh History
          </button>
        </div>

        {loading ? (
          <p style={{ padding: 20, color: "#6B7280" }}>
            Loading transactions...
          </p>
        ) : transactions.length === 0 ? (
          <p style={{ padding: 20, color: "#6B7280" }}>
            No cash transactions found for the selected filters.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                minWidth: 750,
              }}
            >
              <thead>
                <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                  {[
                    "Date",
                    "Branch",
                    "Transaction",
                    "Amount",
                    "From",
                    "To",
                    "Notes",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #E5E7EB",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td style={cellStyle}>
                      {String(transaction.transaction_date).slice(0, 10)}
                    </td>
                    <td style={cellStyle}>{transaction.branch_name}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          color:
                            transaction.transaction_type === "CASH_GIVEN"
                              ? "#166534"
                              : "#1D4ED8",
                          fontWeight: 600,
                        }}
                      >
                        {transaction.transaction_type === "CASH_GIVEN"
                          ? "Cash Given"
                          : "Cash Returned"}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>
                      {money(transaction.amount)}
                    </td>
                    <td style={cellStyle}>
                      {transaction.from_user_name || "—"}
                    </td>
                    <td style={cellStyle}>
                      {transaction.to_user_name || "—"}
                    </td>
                    <td style={{ ...cellStyle, minWidth: 150 }}>
                      {transaction.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #E5E7EB",
  color: "#374151",
  verticalAlign: "top",
};
