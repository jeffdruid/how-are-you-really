import React, { useState } from "react";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button, Alert, Container } from "react-bootstrap";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("Verification email resent. Please check your inbox.");
      setError("");
    } catch (err) {
      setError("Failed to resend verification email. Please try again later.");
      setMessage("");
      console.error("Resend verification error:", err);
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <Container className="mt-5 p-4 border"
      style={{ background: "white" }}
      >
      <h2 className="text-center">Email Verification</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <p className="text-center">
        Verifying your email helps us keep your account secure.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Button variant="primary" onClick={handleResendVerification}>
          Resend Verification Email
        </Button>
        <Button variant="secondary" onClick={handleSkip}>
          Skip for Now
        </Button>
      </div>
    </Container>
  );
};

export default VerifyEmail;
