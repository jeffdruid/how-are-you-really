import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

const NavigationBar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };


  return (
    <Navbar bg="light" expand="lg" sticky="top">
      <Container>
        {/* Navbar brand */}
        <Navbar.Brand as={Link} to="/">
          How Are You Really
        </Navbar.Brand>

        {/* Toggle button for smaller screens */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navbar links and dropdown */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Home link */}
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>

            {/* Conditional Profile link (only if user is logged in) */}
            {currentUser && (
              <Nav.Link as={Link} to="/profile">
                Profile
              </Nav.Link>
            )}

            {/* Dropdown for additional options */}
            <NavDropdown title="More" id="basic-nav-dropdown">
              <NavDropdown.Item as={Link} to="/about">
                About Us
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/contact">
                Contact
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* Conditional buttons (login/signup vs logout) */}
          <Nav>
            {!currentUser ? (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Button as={Link} to="/signup" variant="primary" className="ms-2">
                  Sign Up
                </Button>
              </>
            ) : (
              <Button onClick={handleLogout} variant="danger">
                Logout
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
