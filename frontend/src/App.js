import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import NotificationsList from './components/NotificationsList';
import MoodAnalytics from './components/MoodAnalytics';
import PostPerformance from './components/PostPerformance';
import './App.css';
import { auth, firestore } from './firebase';
import { getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const userDocRef = doc(firestore, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              username: user.displayName || '',
              email: user.email,
              bio: '',
              emailVerified: user.emailVerified,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
          }
          navigate('/'); // Redirect to Home after successful login
        }
      } catch (err) {
        console.error('Error handling redirect result:', err);
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <>
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
        <Route path="/mood-analytics" element={<MoodAnalytics />} /> {/* New route for Mood Analytics */}
        <Route path="/post-performance" element={<PostPerformance />} /> {/* New route for Post Performance */}

        {/* Notifications Route */}
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <NotificationsList />
            </PrivateRoute>
          }
        />

        {/* Protected Home Route */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* This route should be at the end */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
