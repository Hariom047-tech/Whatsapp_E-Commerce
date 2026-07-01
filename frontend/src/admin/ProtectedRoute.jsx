import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("fv_admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
