import { useEffect, useState } from "react";
import api from "../axiosConfig";

function GoldRateSettings() {
  const [currentRate, setCurrentRate] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRate = async () => {
    try {
      const res = await api.get("/api/loans/gold-rate");
      setCurrentRate(res.data);
    } catch (err) {
      console.error("Gold Rate Fetch Error:", err.response?.data);
      alert("Failed to fetch gold rate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const handleUpdate = async () => {
    if (!newRate || Number(newRate) <= 0) {
      alert("Enter valid rate");
      return;
    }

    try {
      await api.post("/api/loans/owner/set-gold-rate", {
        gold_rate: Number(newRate)
      });

      alert("Gold rate updated successfully");
      setNewRate("");
      fetchRate();
    } catch (err) {
      console.error("Gold Rate Update Error:", err.response?.data);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-lg">Loading...</div>;
  }

  if (!currentRate) {
    return <div className="p-6 text-center text-red-500">No gold rate found</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto">

      <h2 className="text-2xl font-bold mb-6 text-center">
        🪙 Gold Rate Settings
      </h2>

      <div className="bg-white shadow-lg p-6 rounded-2xl space-y-6">

        <div className="text-lg">
          <strong>Current Gold Rate:</strong>
          <div className="text-3xl font-bold text-blue-700 mt-2">
            ₹ {currentRate.gold_rate} / gram
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Effective From:
          <div className="font-semibold mt-1">
            {new Date(currentRate.effective_from).toLocaleString("en-IN")}
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="number"
            placeholder="Enter New Rate"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            onClick={handleUpdate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Update Gold Rate
          </button>
        </div>

      </div>
    </div>
  );
}

export default GoldRateSettings;
