import React from "react";
import { useAuth } from "../contexts/AuthContext";
import PostFeed from "../components/PostFeed";
import CreatePost from "../components/CreatePost";
// import SearchBar from "../components/SearchBar";
import { Container, Card, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleVerifyEmailRedirect = () => {
    navigate("/verify-email");
  };

  return (
    <Container className={`mt-4 ${styles.homeContainer}`}>
      {/* App Name and Instructions */}
      <Card className={`text-center shadow-sm ${styles.welcomeBanner}`}>
        <Card.Body>
          <h1 className={styles.cardTitle}>How Are You Really</h1>
          <p className="lead mt-4">
            Express yourself, connect with others, and reflect on your journey.
          </p>
          <ul className="list-unstyled text-start d-inline-block mt-3">
            <li>🔍 Find and connect with people who inspire you.</li>
            <li>📝 Share your thoughts and emotions openly or anonymously.</li>
            <li>📖 Stay updated with recent posts and stories.</li>
          </ul>
          {/* Email Verification Alert */}
          {!currentUser.emailVerified && (
            <Alert variant="warning" className="mt-3">
              <div>
                Your email is not verified.{" "}
                <Button
                  variant="link"
                  onClick={handleVerifyEmailRedirect}
                  className="p-0"
                >
                  Click here to resend verification email.
                </Button>
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Search Bar Section */}
      {/* <Card className={`p-3 shadow-sm ${styles.cardSection}`}>
        <h3 className="mb-4 text-center">Find Posts and People</h3>
        <SearchBar />
      </Card> */}

      {/* Create Post Section */}
      <Card className={`p-3 shadow-sm ${styles.cardSection}`}>
        <h3 className="mb-3 text-center">Share Your Thoughts</h3>
        <CreatePost />
      </Card>

      {/* Post Feed Section */}
      <Card className={`p-3 shadow-sm ${styles.cardSection}`}>
        <h3 className="mb-3 text-center">Recent Posts</h3>
        <PostFeed />
      </Card>
    </Container>
  );
};

export default Home;
