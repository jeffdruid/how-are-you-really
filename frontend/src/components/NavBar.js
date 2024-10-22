import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { FaBell } from 'react-icons/fa';
import GoBackButton from './GoBackButton';

const NavigationBar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(true);
  const navbarRef = useRef(null);

  // Load dark mode preference from localStorage on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.body.classList.toggle('dark-mode', savedMode);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(firestore, 'Users', currentUser.uid, 'Notifications');
    const unreadQuery = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  // Toggle dark mode and save preference to localStorage
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle('dark-mode', newMode);
    localStorage.setItem('darkMode', newMode);
  };

  // Handle navbar collapse
  const handleToggle = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed);
  };

  // Close navbar on link click
  const handleLinkClick = () => {
    setIsNavbarCollapsed(true);
  };

  // Close navbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsNavbarCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Navbar ref={navbarRef} expanded={!isNavbarCollapsed} expand="lg" sticky="top">
      <Container className="d-flex justify-content-between align-items-center">
        {/* Brand on the left */}
        <Navbar.Brand as={Link} to="/" onClick={handleLinkClick}>How Are You Really</Navbar.Brand>

        {/* Notification Bell in the center */}
        {currentUser && (
          <Nav.Link
            as={Link}
            to="/notifications"
            className="position-relative mx-auto"
            onClick={handleLinkClick}
          >
            <FaBell size={20} />
            {unreadCount > 0 && (
              <Badge
                pill
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle"
              >
                {unreadCount}
              </Badge>
            )}
          </Nav.Link>
        )}

        <GoBackButton /> 
        {/* Toggle button on the right */}
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={handleToggle}
          className="ms-auto"
        />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {currentUser && <Nav.Link as={Link} onClick={handleLinkClick} to="/profile">Profile</Nav.Link>}
            {currentUser && <Nav.Link as={Link} onClick={handleLinkClick} to="/notifications">Notifications</Nav.Link>}
            {currentUser && <Nav.Link as={Link} onClick={handleLinkClick} to="/mood-analytics">Mood Analytics</Nav.Link>}
            {currentUser && <Nav.Link as={Link} onClick={handleLinkClick} to="/post-performance">Post Performance</Nav.Link>}
          </Nav>
          <Nav className="align-items-center">
            {/* Dark Mode Toggle Button */}
            <Button onClick={toggleDarkMode} variant={darkMode ? 'light' : 'dark'} className="me-2">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>

            {!currentUser ? (
              <>
                <Nav.Link as={Link} to="/login" onClick={handleLinkClick}>Login</Nav.Link>
                <Button as={Link} to="/signup" variant="primary" className="ms-2">Sign Up</Button>
              </>
            ) : (
              <Button onClick={handleLogout} variant="danger">Logout</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
