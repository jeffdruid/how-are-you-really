import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavigationBar from './components/NavBar';
import HeaderButtons from './components/HeaderButtons';
import { Container } from 'react-bootstrap';
import './App.css';

// Lazy load main pages to split bundles and optimize performance
const Home = lazy(() => import('./components/Home'));
const SignUp = lazy(() => import('./components/SignUp'));
const Login = lazy(() => import('./components/Login'));
const PasswordReset = lazy(() => import('./components/PasswordReset'));
const VerifyEmail = lazy(() => import('./components/VerifyEmail'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const PostDetail = lazy(() => import('./components/PostDetail'));
const NotificationsList = lazy(() => import('./components/NotificationsList'));
const MoodAnalytics = lazy(() => import('./components/MoodAnalytics'));
const PostPerformance = lazy(() => import('./components/PostPerformance'));
const NotFound = lazy(() => import('./components/NotFound'));
const PrivateRoute = lazy(() => import('./components/PrivateRoute'));

const App = () => {
  return (
    <>
      {/* Navigation bar */}
      <NavigationBar />

      {/* Header buttons under the navbar */}
      <HeaderButtons />

      {/* Main content with suspense and lazy loading */}
      <Container className="mt-4">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Private Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileView />
                </PrivateRoute>
              }
            />
            <Route path="/users/:userId" element={<ProfileView />} /> {/* Viewing other users' profiles */}
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route
              path="/mood-analytics"
              element={
                <PrivateRoute>
                  <MoodAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/post-performance"
              element={
                <PrivateRoute>
                  <PostPerformance />
                </PrivateRoute>
              }
            />
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

            {/* Fallback route for unmatched paths */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Container>
    </>
  );
};

export default App;
