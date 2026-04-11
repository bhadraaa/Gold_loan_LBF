import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StaffDashboard from "./pages/StaffDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import CreateLoan from "./pages/CreateLoan";
import SearchLoan from "./pages/SearchLoan";
import LoanDetails from "./pages/loanDetails";
import StaffSummary from "./pages/StaffSummary";
import GoldRateSettings from "./pages/GoldRateSettings";
import TermOverLoans from "./pages/TermOverLoans";
import OwnerActivity from "./pages/OwnerActivity";
import Splash from "./pages/Splash";
import SelectRole from "./pages/SelectRole";


import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/login/:role" element={<Login />} />

      <Route
        path="/loan/:id"
        element={
          <ProtectedRoute role="staff">
            <Layout>
              <LoanDetails />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* STAFF ROUTES */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute role="staff">
            <Layout>
              <StaffDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-loan"
        element={
          <ProtectedRoute role="staff">
            <Layout>
              <CreateLoan />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/search-loan"
        element={
          <ProtectedRoute role="staff">
            <Layout>
              <SearchLoan />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-summary"
        element={
          <ProtectedRoute role="staff">
            <Layout>
              <StaffSummary />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* OWNER ROUTES */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <Layout>
              <OwnerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gold-rate-settings"
        element={
          <ProtectedRoute role="owner">
            <Layout>
              <GoldRateSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner-activity"
        element={
          <ProtectedRoute role="owner">
            <Layout>
              <OwnerActivity />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* BOTH ROLES */}
      <Route
        path="/term-over"
        element={
          <ProtectedRoute role={["staff", "owner"]}>
            <Layout>
              <TermOverLoans />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
