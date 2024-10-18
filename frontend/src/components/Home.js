import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div>
      <h1>Welcome to "How Are You Really"</h1>
      <p>
        Logged in as: {currentUser.email} {currentUser.emailVerified ? '(Verified)' : '(Not Verified)'}
      </p>
      {!currentUser.emailVerified && (
        <p style={{ color: 'orange' }}>
          Your email is not verified. Please check your inbox for a verification email.
        </p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Home;
