import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PostFeed from './PostFeed'; 
import CreatePost from './CreatePost';
import { Container, Button, Alert } from 'react-bootstrap';

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
    <Container className="mt-4">
      <h1 className="text-center mb-4">Welcome to "How Are You Really"</h1>
      <div className="text-center mb-4">
        <p>
          Logged in as: {currentUser.email}{' '}
          {currentUser.emailVerified ? (
            <span className="text-success">(Verified)</span>
          ) : (
            <span className="text-warning">(Not Verified)</span>
          )}
        </p>
        {!currentUser.emailVerified && (
          <Alert variant="warning">
            Your email is not verified. Please check your inbox for a verification email.
          </Alert>
        )}
        <Button variant="danger" onClick={handleLogout} className="me-2">
          Logout
        </Button>
        <Button variant="primary" as={Link} to="/profile">
          Go to Your Profile
        </Button>
      </div>
      <hr />
      {/* Create Post Section */}
      <CreatePost />
      <hr />
      {/* Post Feed Section */}
      <PostFeed />
    </Container>
  );
};

export default Home;
