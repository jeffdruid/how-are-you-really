import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to Login page after logout
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <div>
      <h1>Welcome to "How Are You Really"</h1>
      <p>Logged in as: {auth.currentUser.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Home;
