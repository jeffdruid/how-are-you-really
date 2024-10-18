import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validateEmail';
import { Form, Button, Alert, Container } from 'react-bootstrap';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setMessage('');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('If this email is registered, a password reset link has been sent.');
      setError('');
      // Optionally, redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 5000); // Redirect after 5 seconds
    } catch (err) {
      // Even if an error occurs, display a generic message
      setMessage('If this email is registered, a password reset link has been sent.');
      setError('');
      console.error('Password reset error:', err);
    }
  };

  return (
    <Container className="mt-5">
      <h2>Password Reset</h2>
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
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Send Reset Email
        </Button>
      </Form>
    </Container>
  );
};

export default PasswordReset;
