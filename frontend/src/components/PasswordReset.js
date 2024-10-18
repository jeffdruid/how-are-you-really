import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validateEmail';

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
    <div>
      <h2>Password Reset</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handlePasswordReset}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Send Reset Email</button>
      </form>
    </div>
  );
};

export default PasswordReset;
