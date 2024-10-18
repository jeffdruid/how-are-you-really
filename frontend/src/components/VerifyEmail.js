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
      setError(err.message);
      setMessage('');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Email Verification</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        Please verify your email to access the application. Check your inbox for a verification email.
      </p>
      <button onClick={handleResendVerification}>Resend Verification Email</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default VerifyEmail;
