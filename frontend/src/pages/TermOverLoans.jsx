import { useEffect, useState } from "react";
import axios from "axios";

function TermOverLoans() {
  const token = sessionStorage.getItem("token");
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const fetchLoans = async () => {
      const res = await axios.get(
        "http://localhost:5032/api/loans/term-over",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLoans(res.data);
    };

    fetchLoans();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <h2 className="text-2xl font-semibold mb-6 text-red-600">
        Term Over Loans (6+ Months)
      </h2>

      {loans.length === 0 ? (
        <p>No overdue loans</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Loan No</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Principal</th>
                <th className="border p-2">Remaining</th>
                <th className="border p-2">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="bg-red-50">
                  <td className="border p-2">{loan.loan_number}</td>
                  <td className="border p-2">{loan.customer_name}</td>
                  <td className="border p-2">₹ {loan.loan_amount}</td>
                  <td className="border p-2">
                    ₹ {loan.remaining_principal}
                  </td>
                  <td className="border p-2">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default TermOverLoans;
