import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // User is not authenticated; redirect to login
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
