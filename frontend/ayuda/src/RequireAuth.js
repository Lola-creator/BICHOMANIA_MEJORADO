import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const rol = localStorage.getItem("rol");

  if (!rol) {
    return <Navigate to="/" replace />;
  }

  return children;
}
