import React from "react";
import { useAuth } from "../contexts/AuthContext";
import PostFeed from "../components/PostFeed";
import CreatePost from "../components/CreatePost";
import SearchBar from "../components/SearchBar";
import { Container, Card, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Initialize navigate hook

  const handleVerifyEmailRedirect = () => {
    navigate("/verify-email"); // Redirect to verify-email page
  };

  return (
    <Container className={`mt-4 ${styles.homeContainer}`}>
      {/* Welcome Banner */}
      <Card
        className={`text-center p-4 mb-4 shadow-sm ${styles.welcomeBanner}`}
      >
        <Card.Body>
          <h1 className="display-5">Welcome to "How Are You Really"</h1>
          <p className="lead">
            An interactive platform where you can express, connect, and
            reflect.
          </p>
          {/* Display verification status alert if the user is not verified */}
          {!currentUser.emailVerified && (
            <Alert variant="warning" className="mt-3">
              <div>
                Your email is not verified. Please check your inbox.{" "}
                <Button
                  variant="link"
                  onClick={handleVerifyEmailRedirect}
                  className="p-0"
                >
                  Click here to resend verification email
                </Button>
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Search Bar Section */}
      <Card className="p-3 mb-4 shadow-sm">
        <h3 className="mb-3 mt-3 text-center">Find Posts and People</h3>
        <SearchBar />
      </Card>

      {/* Create Post Section */}
      <Card className="p-3 mb-4 shadow-sm">
        <h3 className="mb-3 mt-3 text-center">Share Your Thoughts</h3>
        <CreatePost />
      </Card>

      {/* Post Feed Section */}
      <Card className="p-3 mb-4 shadow-sm">
        <h3 className="mb-3 mt-3 text-center">Recent Posts</h3>
        <PostFeed />
      </Card>
    </Container>
  );
};

export default Home;
