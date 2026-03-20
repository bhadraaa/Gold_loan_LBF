import { useEffect, useState } from "react";
import axios from "axios";

function StaffSummary() {
  const token = sessionStorage.getItem("token");

  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchSummary = async (date) => {
    const res = await axios.get(
      `http://localhost:5032/api/loans/staff/date-summary?date=${date}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setData(res.data);
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <h2 className="text-2xl font-semibold mb-6">
        Staff Date Summary
      </h2>

      {/* DATE SELECTOR */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded-lg"
        />

        <button
          onClick={() => fetchSummary(selectedDate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          View
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Loans Created</p>
          <p className="text-2xl font-semibold">
            {data.totalLoans}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Total Collection</p>
          <p className="text-2xl font-semibold text-green-600">
            ₹ {data.totalCollection}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Interest Earned</p>
          <p className="text-2xl font-semibold">
            ₹ {data.totalInterest}
          </p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <p className="text-sm text-gray-500">Principal Collected</p>
          <p className="text-2xl font-semibold">
            ₹ {data.totalPrincipal}
          </p>
        </div>

      </div>

      {/* LOANS TABLE */}
      <h3 className="text-lg font-semibold mb-3">
        Loans Created
      </h3>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Loan No</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.loans.map((loan) => (
              <tr key={loan.id}>
                <td className="border p-2">{loan.loan_number}</td>
                <td className="border p-2">{loan.customer_name}</td>
                <td className="border p-2">₹ {loan.loan_amount}</td>
                <td className="border p-2">
                  {new Date(loan.created_at).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYMENTS TABLE */}
      <h3 className="text-lg font-semibold mb-3">
        Payments Received
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Loan No</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Interest</th>
              <th className="border p-2">Principal</th>
              <th className="border p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((pay, index) => (
              <tr key={index}>
                <td className="border p-2">{pay.loan_number}</td>
                <td className="border p-2">₹ {pay.amount_paid}</td>
                <td className="border p-2">₹ {pay.interest_paid}</td>
                <td className="border p-2">₹ {pay.principal_paid}</td>
                <td className="border p-2">
                  {new Date(pay.payment_date).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default StaffSummary;
