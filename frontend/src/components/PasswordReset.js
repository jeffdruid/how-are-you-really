import React, { useState, useCallback } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail } from "../utils/validateEmail";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";
import styles from "../styles/AuthPages.module.css";

const PasswordReset = React.memo(() => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle password reset functionality
  const handlePasswordReset = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate email format
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        setMessage("");
        return;
      }

      try {
        // Send password reset email
        await sendPasswordResetEmail(auth, email);
        setMessage(
          "If this email is registered, a password reset link has been sent."
        );
        setError("");

        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      } catch (err) {
        setMessage(
          "If this email is registered, a password reset link has been sent."
        );
        setError("");
        console.error("Password reset error:", err);
      }
    },
    [email, navigate]
  );

  return (
    <Container
      className={`d-flex align-items-center justify-content-center ${styles.authContainer}`}
    >
      <Card className={styles.authCard}>
        <Card.Body>
          <h2 className="text-center mb-4">Password Reset</h2>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handlePasswordReset}>
            <Form.Group controlId="formEmail">
              <Form.Label>Enter your email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mb-3"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Send Reset Email
            </Button>
          </Form>

          {/* Link to navigate back to login */}
          <div className="text-center mt-3">
            <p>
              Remember your password? <Link to="/login">Log In</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default PasswordReset;
