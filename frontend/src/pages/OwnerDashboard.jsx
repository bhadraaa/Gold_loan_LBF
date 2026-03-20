import { useEffect, useState } from "react";
import api from "../axiosConfig";


function OwnerDashboard() {
  const token = sessionStorage.getItem("token");

  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [finance, setFinance] = useState(null);

  // ✅ FETCH SUMMARY + BRANCHES
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(
          "http://localhost:5032/api/loans/owner/summary",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const branchRes = await api.get(
          "http://localhost:5032/api/loans/owner/branch-summary",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const financeRes = await api.get(
          "http://localhost:5032/api/loans/owner/finance-summary",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setFinance(financeRes.data);


        setSummary(res.data);
        setBranches(branchRes.data);

      } catch (err) {
        console.log("Error fetching summary", err);
      }
    };

    fetchSummary();
  }, []);

  // ✅ MOVE fetchReport OUTSIDE useEffect
  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      alert("Select both dates");
      return;
    }

    try {
      const res = await api.get(
        `http://localhost:5032/api/loans/owner/report?from=${fromDate}&to=${toDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReportData(res.data);
    } catch (err) {
      console.log("Report error:", err);
    }
  };

  if (!summary) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h2 className="text-2xl font-semibold mb-6">
        Owner Dashboard
      </h2>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-2 gap-4">

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Active Loans</p>
          <p className="text-2xl font-semibold">
            {summary.activeLoans}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Total Gold (g)</p>
          <p className="text-2xl font-semibold">
            {summary.totalGold}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-semibold">
            ₹ {summary.totalOutstanding}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Today's Collection</p>
          <p className="text-2xl font-semibold text-green-600">
            ₹ {summary.todayCollection}
          </p>
        </div>

      </div>

      {/* BRANCH BREAKDOWN */}
      <h3 className="text-lg font-semibold mt-8 mb-4">
        Branch Breakdown
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white shadow-sm p-6 rounded-xl"
          >
            <p className="font-semibold">{branch.name}</p>

            <p className="text-sm text-gray-600">
              Active Loans: {branch.active_loans}
            </p>

            <p className="text-sm text-gray-600">
              Total Gold: {branch.total_gold} g
            </p>

            <p className="text-sm text-gray-600">
              Outstanding: ₹ {branch.total_outstanding}
            </p>

            <button
              onClick={() =>
                window.open(
                  `http://localhost:5032/api/loans/owner/export/${branch.id}`,
                  "_blank"
                )
              }
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Export CSV
            </button>

          </div>
        ))}
      </div>
      {finance && (
      <>
        <h3 className="text-lg font-semibold mt-10 mb-4">
          Financial Summary
        </h3>

        <div className="space-y-4">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Total Interest Earned
            </p>
            <p className="text-2xl font-semibold text-green-600">
              ₹ {finance.totalInterest}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Today's Interest
            </p>
            <p className="text-2xl font-semibold">
              ₹ {finance.todayInterest}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Monthly Interest
            </p>
            <p className="text-2xl font-semibold">
              ₹ {finance.monthlyInterest}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">
              Total Collection
            </p>
            <p className="text-2xl font-semibold">
              ₹ {finance.totalCollection}
            </p>
          </div>

        </div>
      </>
    )}


      {/* DATE REPORT */}
      <h3 className="text-lg font-semibold mt-10 mb-4">
        Date Report
      </h3>

      <div className="bg-white p-6 rounded-xl space-y-4">

        <div className="flex flex-wrap gap-4">

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded-lg"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded-lg"
          />

          <button
            onClick={fetchReport}
            className="bg-green-600 text-white px-4 rounded-lg"
          >
            View
          </button>

          <button
            onClick={() =>
              window.open(
                `http://localhost:5032/api/loans/owner/report/export?from=${fromDate}&to=${toDate}`,
                "_blank"
              )
            }
            className="bg-blue-600 text-white px-4 rounded-lg"
          >
            Download CSV
          </button>

        </div>

        {/* TABLE */}
        {reportData.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Loan No</th>
                  <th className="border p-2">Customer</th>
                  <th className="border p-2">Branch</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index}>
                    <td className="border p-2">{row.loan_number}</td>
                    <td className="border p-2">{row.customer_name}</td>
                    <td className="border p-2">{row.branch}</td>
                    <td className="border p-2">₹ {row.loan_amount}</td>
                    <td className="border p-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

export default OwnerDashboard;
