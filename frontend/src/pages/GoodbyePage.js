import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const GoodbyePage = () => {
  return (
    <Container className="d-flex align-items-center justify-content-center mt-5">
      <Card className="text-center p-4 shadow-sm">
        <Card.Body>
          <h2>We're Sorry to See You Go</h2>
          <p>
            Your profile has been deleted successfully. If you ever change your
            mind, you can always create a new account. We would love to have
            you back!
          </p>
          <Button as={Link} to="/signup" variant="primary">
            Create a New Account
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GoodbyePage;
