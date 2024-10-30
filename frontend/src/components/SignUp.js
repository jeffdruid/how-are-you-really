import React, { useState, useCallback } from 'react';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { validateEmail } from '../utils/validateEmail';
import { validatePassword } from '../utils/validatePassword';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from '../styles/AuthPages.module.css';

const SignUp = React.memo(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');

  // Handle sign-up functionality
  const handleSignUp = useCallback(
    async (e) => {
      e.preventDefault();

      let valid = true;

      // Validate email and password
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address.');
        valid = false;
      } else {
        setEmailError('');
      }

      if (!validatePassword(password)) {
        setPasswordError(
          'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.'
        );
        valid = false;
      } else {
        setPasswordError('');
      }

      if (!valid) return;

      try {
        // Create user and send verification email
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);

        // Create a user document in Firestore
        await setDoc(doc(firestore, 'Users', user.uid), {
          username,
          email,
          bio: '',
          emailVerified: user.emailVerified,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        setMessage('Registration successful! Please check your email to verify your account.');
        setError('');
      } catch (err) {
        setError(firebaseErrorMessages(err.code));
      }
    },
    [email, password, username]
  );

  return (
    <Container className={`d-flex align-items-center justify-content-center ${styles.authContainer}`}>
      <Card className={styles.authCard}>
        <Card.Body>
          <h2 className="text-center mb-4">Sign Up</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form onSubmit={handleSignUp}>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && <Alert variant="danger">{emailError}</Alert>}
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Sign Up
            </Button>
          </Form>

          {/* Link to login page if already have an account */}
          <div className="text-center mt-3">
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
