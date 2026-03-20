import { Link } from "react-router-dom";

function Layout({ children }) {
  const role = sessionStorage.getItem("role");

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6">

        <h2 className="text-xl font-semibold mb-6">
          Gold Loan System
        </h2>

        {role === "staff" && (
          <>
            <Link to="/staff" className="block mb-3">Dashboard</Link>
            <Link to="/create-loan" className="block mb-3">New Loan</Link>
            <Link to="/search-loan" className="block mb-3">Search</Link>
            <Link to="/staff-summary" className="block mb-3">Summary</Link>
          </>
        )}

        {role === "owner" && (
          <>
            <Link to="/owner" className="block mb-3">Dashboard</Link>
            <Link to="/owner-activity" className="block mb-3">Activity Logs</Link>
            <Link to="/gold-rate-settings" className="block mb-3">
                Gold Rate Settings
                </Link>     

          </>
        )}
        <Link to="/term-over" className="block mb-3 text-red-600">
        Term Over Loans
        </Link>


      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>

    </div>
  );
}

export default Layout;
