import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/NavBar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import PasswordReset from './components/PasswordReset';
import VerifyEmail from './components/VerifyEmail'; 
import ProfileView from './components/ProfileView';
import NotFound from './components/NotFound';
import PostDetail from './components/PostDetail';
import './App.css';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if the user has a preferred theme from localStorage
    const savedTheme = localStorage.getItem('dark-mode');
    if (savedTheme === 'true') {
      document.body.classList.add('dark-mode');
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
    if (!darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('dark-mode', !darkMode); // Save the theme preference
  };

  return (
    <Router>
      {/* Navigation bar will be visible on every page */}
      <NavigationBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Profile Routes */}
        <Route path="/profile" element={
          <PrivateRoute>
            <ProfileView />
          </PrivateRoute>
        } />
        <Route path="/users/:userId" element={<ProfileView />} /> {/* Viewing other users' profiles */}
        <Route path="/posts/:id" element={<PostDetail />} />

        {/* Protected Home Route */}
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />

        {/* This route should be at the end */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
