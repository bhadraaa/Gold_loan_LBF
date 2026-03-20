import { useNavigate } from "react-router-dom";

function StaffDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Staff Dashboard</h1>

      <div className="space-y-4">
        <button
          onClick={() => navigate("/create-loan")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          ➕ New Loan
        </button>


        <button
          onClick={() => navigate("/search-loan")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          🔍 Search Loan
        </button>


        <button
          onClick={() => navigate("/search-loan")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          💰 Payment
        </button>


        <button
          onClick={() => navigate("/search-loan")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          🔁 Renewal
        </button>

        <button
          onClick={() => navigate("/search-loan")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          ⬆️ Top-up
        </button>


        <button
          onClick={() => navigate("/staff-summary")}
          className="w-full bg-white shadow-sm p-4 rounded-xl text-left"
        >
          📊 Today Summary
        </button>
      </div>
    </div>
  );
}

export default StaffDashboard;
