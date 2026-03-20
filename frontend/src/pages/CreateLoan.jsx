import { useState, useEffect } from "react";
import api from "../axiosConfig";

function CreateLoan() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState([{ name: "", weight: "" }]);
  const [loanAmount, setLoanAmount] = useState("");
  const [manualInterestRate, setManualInterestRate] = useState("");
  const [goldRate, setGoldRate] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await api.get("/api/loans/gold-rate");

        if (res.data?.gold_rate) {
          setGoldRate(Number(res.data.gold_rate));
        } else {
          setGoldRate(0);
        }

      } catch (err) {
        console.log("Failed to fetch gold rate");
        setGoldRate(0);
      }
    };

    fetchRate();
  }, []);



  // 🔹 Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", weight: "" }]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ name: "", weight: "" }]);
  };

  // 🔹 Calculations
  const totalWeight = items.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0
  );

  const eligibleAmount = totalWeight * goldRate;
  const isSpecialLoan = Number(loanAmount) > 40000;

  // 🔹 Submit Loan
  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);

    if (!customerName || !phone || !address || !loanAmount) {
      setMessage("All fields are required");
      setIsError(true);
      return;
    }

    if (items.length === 0) {
      setMessage("Add at least one gold item");
      setIsError(true);
      return;
    }

    if (items.some(item => !item.name || Number(item.weight) <= 0)) {
      setMessage("All gold items must have valid name and weight");
      setIsError(true);
      return;
    }

    if (Number(loanAmount) <= 0) {
      setMessage("Loan amount must be greater than zero");
      setIsError(true);
      return;
    }

    if (manualInterestRate !== "") {
      const rate = Number(manualInterestRate);
      if (rate < 0 || rate >= 60) {
        setMessage("Interest rate must be >= 0 and < 60");
        setIsError(true);
        return;
      }
    }

    setLoading(true);

    try {
      await api.post("/api/loans/create", {
        customer_name: customerName,
        phone,
        address,
        items,
        loan_amount: Number(loanAmount),
        custom_rate: manualInterestRate !== "" ? Number(manualInterestRate) : null,
      });

      setMessage("Loan Created Successfully!");
      setIsError(false);

      // Reset form
      setCustomerName("");
      setPhone("");
      setAddress("");
      setItems([{ name: "", weight: "" }]);
      setLoanAmount("");
      setManualInterestRate("");

    } catch (err) {
      setMessage(
        err.response?.data?.message || "Error creating loan"
      );
      setIsError(true);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">

      <h2 className="text-2xl font-semibold mb-6">
        Gold Loan Registration
      </h2>

      {message && (
        <div
          className={`mb-4 text-sm p-3 rounded-lg ${isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
            }`}
        >
          {message}
        </div>
      )}

      {/* Customer Info */}
      <input
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      />

      <input
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      />

      <textarea
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full mb-6 p-3 border rounded-lg"
      />

      {/* Items Section */}
      <h3 className="font-medium mb-3">Gold Items</h3>

      {items.map((item, index) => (
        <div key={index} className="flex gap-2 mb-3">
          <input
            placeholder="Item Name"
            value={item.name}
            onChange={(e) =>
              handleItemChange(index, "name", e.target.value)
            }
            className="flex-1 p-3 border rounded-lg"
          />

          <input
            placeholder="Weight (g)"
            type="number"
            min="0"
            value={item.weight}
            onChange={(e) =>
              handleItemChange(index, "weight", e.target.value)
            }
            className="w-28 p-3 border rounded-lg"
          />

          {items.length > 1 && (
            <button
              onClick={() => removeItem(index)}
              className="text-red-500 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addItem}
        className="text-blue-600 text-sm mb-6"
      >
        + Add Item
      </button>

      {/* Calculation Box */}
      <div className="bg-white shadow-sm p-4 rounded-xl mb-6 space-y-2 border">
        <p>Total Weight: <strong>{totalWeight.toFixed(2)} g</strong></p>
        <p>Gold Rate: ₹ {goldRate.toLocaleString("en-IN")} / g</p>
        <p>
          Eligible Amount:{" "}
          <strong>
            ₹ {eligibleAmount.toLocaleString("en-IN")}
          </strong>
        </p>
      </div>

      {/* Loan Amount */}
      <input
        placeholder="Loan Amount Given"
        type="number"
        min="0"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        className="w-full mb-6 p-3 border rounded-lg"
      />

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <p className="text-blue-800 font-semibold mb-2">💡 Optional Custom Interest</p>
        <p className="text-sm text-blue-700 mb-3">Leave empty for standard slab-based interest calculation.</p>
        <input
          placeholder="Custom Interest Rate (% per annum)"
          type="number"
          min="0"
          max="59.99"
          step="0.01"
          value={manualInterestRate}
          onChange={(e) => setManualInterestRate(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? "Processing..." : "Register Loan"}
      </button>

    </div>
  );
}

export default CreateLoan;
