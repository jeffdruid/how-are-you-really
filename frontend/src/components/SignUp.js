import React, { useState, useCallback } from "react";
import { auth, firestore } from "../firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { validateEmail } from "../utils/validateEmail";
import { validatePassword } from "../utils/validatePassword";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import styles from "../styles/AuthPages.module.css";

const SignUp = React.memo(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm Password Field
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // Confirm Password Error
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); // Initialize navigate hook
  const location = useLocation(); // Use location to check for success messages
  const successMessage = location.state?.successMessage;

  // Handle sign-up functionality
  const handleSignUp = useCallback(
    async (e) => {
      e.preventDefault();

      let valid = true;

      // Validate email
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address.");
        valid = false;
      } else {
        setEmailError("");
      }

      // Validate password
      if (!validatePassword(password)) {
        setPasswordError(
          "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.",
        );
        valid = false;
      } else {
        setPasswordError("");
      }

      // Validate confirm password
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        valid = false;
      } else {
        setConfirmPasswordError("");
      }

      if (!valid) return;

      try {
        // Create user and send verification email
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;
        sendEmailVerification(user); // Send verification email (non-blocking)

        // Create a user document in Firestore
        await setDoc(doc(firestore, "Users", user.uid), {
          username,
          email,
          bio: "",
          emailVerified: user.emailVerified,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        setMessage(
          "Registration successful! A verification email has been sent to your inbox. You can continue using the app.",
        );
        setError("");

        // Redirect to home page
        navigate("/");
      } catch (err) {
        setError(firebaseErrorMessages(err.code));
      }
    },
    [email, password, confirmPassword, username, navigate],
  );

  return (
    <Container
      className={`d-flex align-items-center justify-content-center ${styles.authContainer}`}
    >
      <Card className={styles.authCard}>
        <Card.Body>
          <h2 className="text-center mb-4">Sign Up</h2>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form onSubmit={handleSignUp}>
            {/* Username Field */}
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label className="d-none">Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            {/* Email Field */}
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="d-none">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && <Alert variant="danger">{emailError}</Alert>}
            </Form.Group>

            {/* Password Field */}
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label className="d-none">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && (
                <Alert variant="danger">{passwordError}</Alert>
              )}
            </Form.Group>

            {/* Confirm Password Field */}
            <Form.Group controlId="formConfirmPassword" className="mb-3">
              <Form.Label className="d-none">Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPasswordError && (
                <Alert variant="danger">{confirmPasswordError}</Alert>
              )}
            </Form.Group>

            {/* Submit Button */}
            <Button variant="primary" type="submit" className="w-100">
              Sign Up
            </Button>
          </Form>

          {/* Link to login page if already have an account */}
          <div className="text-center mt-4">
            <p>
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default SignUp;
