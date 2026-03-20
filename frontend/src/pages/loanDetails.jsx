import { useEffect, useState } from "react";
import api from "../axiosConfig";
import { useParams } from "react-router-dom";

function LoanDetails() {
  const { id } = useParams();

  const [loan, setLoan] = useState(null);
  const [closeAmount, setCloseAmount] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [payments, setPayments] = useState([]);
  const [interestData, setInterestData] = useState(null);
  const [today, setToday] = useState(new Date());
  const [renewedLoan, setRenewedLoan] = useState(null); // ✅ NEW STATE

  // ===============================
  // Fetch Loan + Payments
  // ===============================
  const fetchLoanData = async () => {
    try {
      const res = await api.get(`/api/loans/${id}`);
      setLoan(res.data);

      const paymentRes = await api.get(`/api/loans/${id}/payments`);
      setPayments(paymentRes.data);
    } catch (err) {
      console.log("Error fetching loan:", err.response?.data);
    }
  };

  const fetchInterest = async () => {
    try {
      const res = await api.get(`/api/loans/${id}/interest`);
      setInterestData(res.data);
    } catch (err) {
      console.log("Interest fetch error:", err.response?.data);
    }
  };

  // ✅ NEW: Fetch Renewed Loan
  const fetchRenewedLoan = async () => {
    try {
      const res = await api.get(`/api/loans/${id}/renewed-loan`);
      setRenewedLoan(res.data);
    } catch (err) {
      console.log("No renewed loan found");
      setRenewedLoan(null);
    }
  };

  const handlePayment = async () => {
    if (!closeAmount || Number(closeAmount) <= 0) {
      setPaymentMessage("Enter valid payment amount");
      return;
    }

    try {
      const res = await api.post(`/api/loans/${id}/payment`, {
        amount_paid: Number(closeAmount)
      });

      setPaymentMessage(
        `Payment Added | Interest: ₹${res.data.interestPaid} | Principal: ₹${res.data.principalPaid}`
      );

      setCloseAmount("");
      fetchLoanData();
      fetchInterest();
    } catch (err) {
      setPaymentMessage(err.response?.data?.message || "Payment failed");
    }
  };

  const handleRenew = async () => {
    try {
      const res = await api.post(`/api/loans/${id}/renew`);
      alert(
        `Loan Renewed!\nCapitalized Interest: ₹${res.data.capitalizedInterest}\nNew Principal: ₹${res.data.newPrincipal}`
      );
      window.location.href = `/loan/${res.data.newLoan.id}`;
    } catch (err) {
      alert(err.response?.data?.message || "Renew failed");
    }
  };

  const handleTopUp = async () => {
    if (!extraAmount || Number(extraAmount) <= 0) {
      alert("Enter valid extra amount");
      return;
    }

    try {
      await api.post(`/api/loans/${id}/topup`, {
        extra_amount: Number(extraAmount)
      });

      alert("Top-up added successfully");
      setExtraAmount("");
      fetchLoanData();
      fetchInterest();
    } catch (err) {
      alert(err.response?.data?.message || "Top-up failed");
    }
  };

  useEffect(() => {
    fetchLoanData();
    fetchInterest();

    // ✅ FETCH RENEWED LOAN IF STATUS IS RENEWED
    if (loan?.status === "renewed") {
      fetchRenewedLoan();
    }

    const interval = setInterval(() => {
      setToday(new Date());
      fetchInterest();
    }, 60000);
    return () => clearInterval(interval);
  }, [id, loan?.status]); // ✅ Added loan?.status dependency

  if (!loan) return (
    <div className="container mx-auto p-6 max-w-6xl flex items-center justify-center min-h-screen">
      <div className="text-xl font-semibold text-gray-600">Loading loan details...</div>
    </div>
  );

  // ✅ FIXED: 3 Status States
  const isClosed = loan.status === "closed";
  const isRenewed = loan.status === "renewed";
  const isActive = loan.status === "active";

  const items = loan.items || [];
  const totalGoldWeight = items.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
  const isOverdue = interestData?.days > 90;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* 1️⃣ Header Section - ✅ FIXED STATUS BADGE */}
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🏦 Loan Details</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-lg">
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-500 block">Loan No:</span>
            <strong>{loan.loan_number}</strong>
          </div>

          {/* ✅ PERFECT 3-STATE BADGE */}
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-500 block">Status:</span>
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${isClosed
              ? 'bg-red-100 text-red-800 border-2 border-red-200'
              : isRenewed
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'
                : 'bg-green-100 text-green-800 border-2 border-green-200'
              }`}>
              {isClosed
                ? '🔴 Closed'
                : isRenewed
                  ? '🟡 Renewed'
                  : '🟢 Active'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-500 block">Created:</span>
            <strong>{new Date(loan.created_at).toLocaleDateString('en-IN')}</strong>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-500 block">Branch:</span>
            <strong>{loan.branch || 'BR1'}</strong>
          </div>
          {isClosed && loan.closed_on && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500 block">Closed:</span>
              <strong>{new Date(loan.closed_on).toLocaleDateString('en-IN')}</strong>
            </div>
          )}
        </div>

        {/* ✅ RENEWED LOAN LINK */}
        {isRenewed && renewedLoan && (
          <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl shadow-lg">
            <div className="text-xl font-bold text-yellow-800 mb-3">
              🔄 This loan has been renewed
            </div>
            <a
              href={`/loan/${renewedLoan.id}`}  // ← Uses renewedLoan.id
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-all shadow-lg"
            >
              👉 View New Loan: <span className="ml-2 font-mono">#{renewedLoan.loan_number}</span>
            </a>
          </div>
        )}

      </div>

      {/* 2️⃣ Customer + 3️⃣ Gold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Customer Information</h2>
          <div className="space-y-4 text-lg">
            <div><strong>Name:</strong> {loan.customer_name}</div>
            <div><strong>Phone:</strong> {loan.phone}</div>
            <div className="text-gray-700"><strong>Address:</strong> {loan.address}</div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💎 Gold Details</h2>
          <div className="space-y-4">
            <h3 className="font-bold text-xl mb-4">Gold Items:</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                  <span className="font-semibold text-lg">{item.name}</span>
                  <span className="text-2xl font-black text-orange-700">{item.weight}g</span>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl border-4 border-orange-300 mt-6">
              <div className="text-3xl font-black text-center text-orange-800">
                Total Gold Weight: {totalGoldWeight}g
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4️⃣ Financial Summary */}
      <div className={`shadow-2xl rounded-2xl p-10 border-4 ${isOverdue ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50' : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50'}`}>
        <h2 className="text-4xl font-black text-center mb-10 tracking-tight">
          📊 Financial Summary
        </h2>
        {interestData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
              <div className="p-6 bg-blue-50 rounded-2xl border-4 border-blue-200 text-center">
                <div className="text-3xl font-black text-blue-800 mb-1">Base Principal Given</div>
                <div className="text-4xl font-black text-blue-900">
                  ₹{Number(loan.loan_amount)?.toLocaleString() || '—'}
                </div>
                {Number(loan.total_principal) > Number(loan.loan_amount) && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-xl text-purple-900 text-xl font-bold border-2 border-purple-300">
                    ➕ Top-Ups Added: ₹{(Number(loan.total_principal) - Number(loan.loan_amount)).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-xl">
                <div className="p-5 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Remaining Principal</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{interestData.remainingPrincipal?.toLocaleString()}
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Interest Rate</div>
                  <div className="text-3xl font-bold">{loan.interest_rate || 12}%</div>
                  <div className="text-xs text-gray-500 mt-1 font-semibold">
                    {loan.custom_interest_rate !== null && loan.custom_interest_rate !== undefined
                      ? `Custom Interest Applied: ${loan.custom_interest_rate}%`
                      : "Standard Slab Interest Applied"}
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Loan Type</div>
                  <div className="text-3xl font-bold">{loan.loan_type === 'special' ? '⭐ Special' : 'Normal'}</div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <div className="text-lg font-semibold text-gray-700 mb-2">Days Running</div>
                <div className={`text-4xl font-black ${isOverdue ? 'text-orange-600' : 'text-indigo-700'}`}>
                  {interestData.days} days
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                <div className="text-2xl font-bold text-gray-900 mb-2">Interest Till Today</div>
                <div className="text-4xl font-black text-orange-600">
                  ₹{interestData.interest?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
              <div className={`p-8 rounded-3xl shadow-2xl text-center text-5xl font-black ${isOverdue ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' :
                'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                }`}>
                Total Payable Today
                <div className="text-6xl mt-4 leading-tight">
                  ₹{(interestData.remainingPrincipal + interestData.interest)?.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-2">Total Paid</div>
                  <div className="text-4xl font-black text-emerald-600">
                    ₹{loan.total_paid?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-2">Remaining</div>
                  <div className={`text-4xl font-black ${isOverdue ? 'text-red-600' : 'text-red-500'}`}>
                    ₹{(interestData.remainingPrincipal + interestData.interest - (loan.total_paid || 0))?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl animate-spin mb-6">⏳</div>
            <p className="text-2xl font-semibold text-gray-600">Calculating interest...</p>
          </div>
        )}
      </div>

      {/* ✅ FIXED: Only show for ACTIVE loans */}
      {isActive && (
        <div className="bg-white shadow-2xl rounded-3xl p-10 border-2 border-gray-200">
          <h2 className="text-3xl font-black text-center mb-10 text-gray-900">💳 Close Loan (Full Settlement)</h2>

          <div className="max-w-2xl mx-auto mb-12 p-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl border-4 border-red-200 shadow-xl">
            <div className="text-center mb-8">
              <div className="text-4xl font-black text-red-700 mb-3 tracking-tight">
                Total Payable Today
              </div>
              <div className="text-6xl font-black text-red-600 mb-4">
                ₹{(interestData?.remainingPrincipal + interestData?.interest)?.toLocaleString()}
              </div>
              <div className="text-xl font-semibold text-red-800 bg-red-100 px-6 py-2 rounded-full inline-block">
                Full amount required to close
              </div>
            </div>

            <div className="flex gap-6 items-end">
              <input
                type="number"
                placeholder="Enter Full Settlement Amount"
                value={closeAmount}
                onChange={(e) => setCloseAmount(e.target.value)}
                className="flex-1 p-6 border-4 border-red-300 rounded-2xl text-2xl font-bold focus:ring-8 focus:ring-red-200 focus:border-red-500 text-right"
              />
              <button
                onClick={handlePayment}
                className="px-16 py-8 bg-gradient-to-r from-red-600 to-red-700 text-white text-2xl font-black rounded-2xl hover:from-red-700 hover:to-red-800 shadow-2xl hover:shadow-3xl transition-all h-20 flex items-center justify-center"
              >
                🚫 CLOSE LOAN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8 border-t-4 border-gray-200">
            <button
              onClick={handleRenew}
              className="p-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl font-bold rounded-2xl hover:from-yellow-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transition-all"
            >
              🔄 RENEW LOAN
            </button>
            <div className="space-y-3">
              <label className="text-lg font-semibold block">➕ Extra Amount (Top-Up)</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Enter extra ₹"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  className="flex-1 p-4 border-2 border-purple-300 rounded-xl text-lg focus:ring-4 focus:ring-purple-200"
                />
                <button
                  onClick={handleTopUp}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-xl"
                >
                  ADD TOP-UP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ HIDE FOR RENEWED/CLOSED */}
      {isClosed && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-4 border-red-200 rounded-3xl p-16 text-center shadow-2xl">
          <div className="text-7xl mb-8">🔴</div>
          <h2 className="text-4xl font-black text-red-800 mb-4">LOAN FULLY CLOSED</h2>
          <p className="text-2xl text-red-700 font-semibold">Complete settlement received</p>
        </div>
      )}

      {/* 6️⃣ Payment History */}
      <div className="bg-white shadow-2xl rounded-3xl p-10 border-2 border-gray-200">
        <h2 className="text-3xl font-black text-gray-900 mb-10">🧾 Payment History</h2>
        <div className="overflow-x-auto rounded-2xl border-4 border-gray-200">
          {payments.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-12 border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-6">📭</div>
              <p className="text-2xl font-semibold">No payments recorded yet</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-8 py-6 text-left text-xl font-black text-gray-800 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-6 text-left text-xl font-black text-gray-800 uppercase tracking-wider">Total Amount Paid</th>
                  <th className="px-8 py-6 text-left text-xl font-black text-gray-800 uppercase tracking-wider">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((pay, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                    <td className="px-8 py-8 whitespace-nowrap">
                      <div className="text-2xl font-black text-gray-900">
                        {new Date(pay.payment_date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-8 py-8 whitespace-nowrap">
                      <div className="text-4xl font-black text-emerald-600 mb-2">
                        ₹{pay.amount_paid?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>Interest: ₹{pay.interest_paid}</span>
                        <span>Principal: ₹{pay.principal_paid}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 whitespace-nowrap text-xl font-bold text-gray-800">
                      {pay.received_by || 'Branch Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {paymentMessage && (
        <div className={`p-8 rounded-3xl text-center text-2xl font-bold shadow-xl ${paymentMessage.includes('Payment Added')
          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-4 border-emerald-300'
          : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-4 border-red-300'
          }`}>
          {paymentMessage}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => window.print()}
          className="px-16 py-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-2xl font-black rounded-3xl shadow-2xl hover:shadow-3xl hover:from-indigo-700 hover:to-purple-800 transition-all transform hover:-translate-y-1"
        >
          🧾 PRINT RECEIPT
        </button>
      </div>

      {/* Print styles remain same */}
      <style jsx>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: absolute; left: 0; top: 0; width: 100%; 
            box-shadow: none !important; border: 4px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LoanDetails;
