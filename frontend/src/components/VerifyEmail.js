import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email resent. Please check your inbox.');
      setError('');
    } catch (err) {
      setError('Failed to resend verification email. Please try again later.');
      setMessage('');
      console.error('Resend verification error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out. Please try again.');
      console.error('Logout error:', err);
    }
  };

  return (
    <div>
      <h2>Email Verification</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Please verify your email to access all features of the application.</p>
      <button onClick={handleResendVerification}>Resend Verification Email</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default VerifyEmail;
