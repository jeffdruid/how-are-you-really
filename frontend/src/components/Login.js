import React, { useState, useCallback } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail } from "../utils/validateEmail";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import SocialLogin from "./SocialLogin";
import { Form, Button, Container, Alert, Card } from "react-bootstrap";
import styles from "../styles/AuthPages.module.css";

const Login = React.memo(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  // Handle login functionality
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate email format
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address.");
        return;
      } else {
        setEmailError("");
      }

      try {
        // Sign in user
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      } catch (err) {
        setError(firebaseErrorMessages(err.code));
      }
    },
    [email, password, navigate],
  );

  return (
    <Container
      className={`d-flex align-items-center justify-content-center ${styles.authContainer}`}
    >
      <Card className={styles.authCard}>
        <Card.Body>
          <h2 className="text-center mb-4">Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="d-none">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isInvalid={!!emailError}
                required
              />
              <Form.Control.Feedback type="invalid">
                {emailError}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label className="d-none">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
          </Form>

          {/* Links to navigate to signup or password reset */}
          <div className="text-center mt-4">
            <p>
              Don’t have an account? <Link to="/signup">Sign Up</Link>
            </p>
            <p>
              Forgot your password?{" "}
              <Link to="/password-reset">Reset Password</Link>
            </p>
            <hr className="mt-3" />
            <SocialLogin />
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default Login;
