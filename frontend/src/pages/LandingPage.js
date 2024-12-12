import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import styles from "../styles/LandingPage.module.css";

const LandingPage = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchUsername = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(firestore, "Users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || "User");
          } else {
            setUsername("User");
          }
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername("User");
        }
      }
    };

    fetchUsername();
  }, [currentUser]);

  return (
    <div className={styles.landingWrapper}>
      {/* Hero Section */}
      <header className={styles.landingHeader}>
        <Container>
          <Row className="align-items-center text-center">
            <Col>
              <h1 className={styles.heading}>
                Welcome to <br />
                <span className={styles.siteName}>"How Are You Really"</span>
              </h1>
              <p className={styles.subHeading}>
                A safe space to express, connect, and reflect on your journey.
              </p>
              <div className={styles.buttonGroup}>
                {currentUser ? (
                  <>
                    <p className={styles.welcomeUser}>
                      Welcome back, <strong>{username}</strong>!
                    </p>
                    <Link to="/home">
                      <Button className={styles.ctaButton}>Home</Button>
                    </Link>
                    <Link to="/profile">
                      <Button
                        variant="outline-light"
                        className={styles.ctaButton}
                      >
                        Profile
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signup">
                      <Button className={styles.ctaButton}>Get Started</Button>
                    </Link>
                    <Link to="/login">
                      <Button
                        variant="outline-light"
                        className={styles.ctaButton}
                      >
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* Feature Section */}
      <main className={styles.featureSection}>
        <Container>
          <h2 className="text-center mb-5">Why Join Us?</h2>
          <Row>
            <Col md={4}>
              <Card className={styles.featureCard}>
                <Card.Body className={styles.featureCardBody}>
                  <h4 className={styles.featureTitle}>Share Your Thoughts</h4>
                  <p className={styles.featureDescription}>
                    Express yourself openly or anonymously in a supportive
                    space.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className={styles.featureCard}>
                <Card.Body className={styles.featureCardBody}>
                  <h4 className={styles.featureTitle}>Connect with Others</h4>
                  <p className={styles.featureDescription}>
                    Build meaningful relationships and engage in conversations.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className={styles.featureCard}>
                <Card.Body className={styles.featureCardBody}>
                  <h4 className={styles.featureTitle}>Track Your Journey</h4>
                  <p className={styles.featureDescription}>
                    Reflect on your emotions and progress over time.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default LandingPage;
