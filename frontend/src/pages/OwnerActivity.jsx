import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../axiosConfig";

function OwnerActivity() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/loans/owner/activity");
      setLogs(res.data);
      setFilteredLogs(res.data);
    } catch (err) {
      console.log("Error fetching logs:", err.response?.data);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Unique branches for dropdown
  const uniqueBranches = [...new Set(logs.map(log => log.branch_name))];

  // Filtering
  useEffect(() => {
    let filtered = [...logs];

    if (search) {
      filtered = filtered.filter(log =>
        log.loan_number?.toLowerCase().includes(search.toLowerCase()) ||
        log.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (branchFilter) {
      filtered = filtered.filter(log => log.branch_name === branchFilter);
    }

    if (fromDate) {
      filtered = filtered.filter(log =>
        new Date(log.created_at) >= new Date(fromDate)
      );
    }

    if (toDate) {
      filtered = filtered.filter(log =>
        new Date(log.created_at) <= new Date(toDate + "T23:59:59")
      );
    }

    setFilteredLogs(filtered);
  }, [search, branchFilter, fromDate, toDate, logs]);

  const clearFilters = () => {
    setSearch("");
    setBranchFilter("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">

      {/* Header */}
      <div className="bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-4xl font-black mb-6">📜 Owner Activity Logs</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

          {/* Improved Search */}
          <div className="col-span-2">
            <label className="text-sm font-semibold">Search</label>
            <input
              type="text"
              placeholder="Loan No / Staff / Action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          {/* Branch Dropdown */}
          <div>
            <label className="text-sm font-semibold">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">All Branches</option>
              {uniqueBranches.map((branch, i) => (
                <option key={i} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {/* Date Filters */}
          <div>
            <label className="text-sm font-semibold">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </div>

        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-600">
            Total Records: {filteredLogs.length}
          </div>

          <button
            onClick={clearFilters}
            className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-2xl rounded-3xl p-8 border-2 border-gray-200">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xl font-semibold">
            No activity records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Date</th>
                  <th className="px-6 py-4 text-left font-bold">Staff</th>
                  <th className="px-6 py-4 text-left font-bold">Branch</th>
                  <th className="px-6 py-4 text-left font-bold">Action</th>
                  <th className="px-6 py-4 text-left font-bold">Loan</th>
                  <th className="px-6 py-4 text-left font-bold">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <>
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 font-semibold">{log.staff_name}</td>
                      <td className="px-6 py-4">{log.branch_name}</td>
                      <td className="px-6 py-4">{log.action}</td>
                      <td className="px-6 py-4">
                        {log.loan_id ? (
                          <Link
                            to={`/loan/${log.loan_id}`}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            {log.loan_number}
                          </Link>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === log.id ? null : log.id)
                          }
                          className="text-indigo-600 font-semibold"
                        >
                          {expandedRow === log.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details */}
                    {expandedRow === log.id && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-6 py-6 text-sm text-gray-700">
                          <div className="space-y-2">
                            <div><strong>Action Details:</strong> {log.action}</div>
                            <div><strong>Staff:</strong> {log.staff_name}</div>
                            <div><strong>Branch:</strong> {log.branch_name}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerActivity;
