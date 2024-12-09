import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import NavigationBar from "./components/NavBar";
import HeaderButtons from "./components/HeaderButtons";
import Footer from "./components/Footer";
import { Container } from "react-bootstrap";
import "./App.css";

// Lazy load pages to split bundles and optimize performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ProfileView = lazy(() => import("./pages/ProfileView"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const NotificationsList = lazy(() => import("./pages/NotificationsList"));
const MoodAnalytics = lazy(() => import("./pages/MoodAnalytics"));
const PostPerformance = lazy(() => import("./pages/PostPerformance"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GoodbyePage = lazy(() => import("./pages/GoodbyePage"));
const PrivateRoute = lazy(() => import("./components/PrivateRoute"));

const App = () => {
  return (
    <>
      {/* Navigation bar */}
      <NavigationBar />

      {/* Header buttons under the navbar */}
      <HeaderButtons />

      {/* Main content with suspense and lazy loading */}
      <Container className="content-wrapper mt-4">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/goodbye" element={<GoodbyePage />} />

            {/* Private Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileView />
                </PrivateRoute>
              }
            />
            <Route path="/users/:userId" element={<ProfileView />} />
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
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute isAdmin={true}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Container>

      {/* Footer at the bottom */}
      <Footer />
    </>
  );
};

export default App;
