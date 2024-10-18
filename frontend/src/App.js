import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from './components/NavBar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import PasswordReset from './components/PasswordReset';
import VerifyEmail from './components/VerifyEmail'; 
import ProfileView from './components/ProfileView';

const App = () => {
  return (
    <Router>
       {/* Navigation bar will be visible on every page */}
       <NavigationBar />
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
        
        {/* Protected Home Route */}
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
