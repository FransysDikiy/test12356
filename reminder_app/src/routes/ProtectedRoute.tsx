import React from "react";
import { Navigate, RouteProps } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spin } from "antd";

interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRoles: string[];
  routeProps: RouteProps;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                         element,
                                                         allowedRoles,
                                                       }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
        <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </div>
    );
  }

  if (!isAuthenticated || !allowedRoles.includes(user?.role || "")) {
    return <Navigate to="/login" />;
  }

  return <>{element}</>;
};

export default ProtectedRoute;
