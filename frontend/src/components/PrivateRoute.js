import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // User is not authenticated; redirect to login
    return <Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    // User is authenticated but email is not verified; redirect to verify-email
    return <Navigate to="/verify-email" />;
  }

  // User is authenticated and email is verified; render the child component
  return children;
};

export default PrivateRoute;
