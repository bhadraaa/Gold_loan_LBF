import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const userRole = sessionStorage.getItem("role");

  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  if (Array.isArray(role)) {
    if (!role.includes(userRole)) {
      return <Navigate to={`/${userRole}`} replace />;
    }
  } else {
    if (userRole !== role) {
      return <Navigate to={`/${userRole}`} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
