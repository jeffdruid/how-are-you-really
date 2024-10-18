import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="text-center my-5">
      <h1 className="display-1">404</h1>
      <h2>Page Not Found</h2>
      <p className="lead">The page you are looking for does not exist.</p>
      <Link to="/">
        <Button variant="primary" size="lg">
          Go Home
        </Button>
      </Link>
    </Container>
  );
};

export default NotFound;
