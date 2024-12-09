import React from "react";
import { Link } from "react-router-dom";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import styles from "../styles/LandingPage.module.css";

const LandingPage = () => {
  return (
    <div className={styles.landingWrapper}>
      <header className={styles.landingHeader}>
        <Container>
          <Row className="align-items-center text-center">
            <Col>
              <h1 className={styles.heading}>
                Welcome to "How Are You Really"
              </h1>
              <p className={styles.subHeading}>
                A safe space to express, connect, and reflect on your journey.
              </p>
              <div className={styles.buttonGroup}>
                <Link to="/signup">
                  <Button className={styles.ctaButton}>Get Started</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline-light" className={styles.ctaButton}>
                    Login
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

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
