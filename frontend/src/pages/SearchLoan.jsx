import { useState } from "react";
import api from "../axiosConfig";

import { useNavigate } from "react-router-dom";

function SearchLoan() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await api.get(
        `http://localhost:5032/api/loans/search?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResults(res.data);
    } catch (err) {
      alert("Search failed");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">Search Loan</h2>

      <div className="flex mb-6">
        <input
          placeholder="Enter name / phone / loan number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 border rounded-l-lg"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded-r-lg"
        >
          Search
        </button>
      </div>

      <div className="space-y-3">
        {results.map((loan) => (
          <div
            key={loan.id}
            className="bg-white shadow-sm p-4 rounded-xl"
          >
            <p className="font-medium">{loan.customer_name}</p>
            <p className="text-sm text-gray-600">
              {loan.loan_number}
            </p>
            <p className="text-sm">
              ₹ {loan.loan_amount}
            </p>

            <button
              onClick={() => navigate(`/loan/${loan.id}`)}
              className="text-blue-600 text-sm mt-2"
            >
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchLoan;
