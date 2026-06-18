import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "./ui.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
