import React, { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Container, Badge, NavDropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../firebase";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { FaBell } from "react-icons/fa";
import styles from "../styles/NavigationBar.module.css";

const NavigationBar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState(false); // Tracks if the navbar is expanded
  const navbarRef = useRef(null); // Ref for detecting clicks outside the navbar

  // Fetch unread notifications count
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(
      firestore,
      "Users",
      currentUser.uid,
      "Notifications"
    );
    const unreadQuery = query(notificationsRef, where("read", "==", false));

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Close the navbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  return (
    <Navbar
      ref={navbarRef}
      expand="lg"
      bg="light"
      variant="light"
      sticky="top"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      className={`shadow-sm ${styles.navbarContainer}`}
    >
      <Container fluid className="justify-content-between">
        {/* Brand */}
        <Navbar.Brand as={NavLink} to="/" className={styles.brand} onClick={() => setExpanded(false)}>
          How Are You Really
        </Navbar.Brand>

        {/* Notification Icon */}
        {currentUser && (
          <Nav.Link
            as={NavLink}
            to="/notifications"
            className={styles.notificationIcon}
            onClick={() => setExpanded(false)}
          >
            <FaBell size={20} />
            {unreadCount > 0 && (
              <Badge pill bg="danger" className={styles.notificationBadge}>
                {unreadCount}
              </Badge>
            )}
          </Nav.Link>
        )}

        {/* Navbar Toggle */}
        <Navbar.Toggle aria-controls="navbar-nav" onClick={() => setExpanded(!expanded)} />

        {/* Collapsible Navbar */}
        <Navbar.Collapse id="navbar-nav" className={styles.navbarCollapse}>
          <Nav className="ms-auto">
            {/* Home Link */}
            <Nav.Link
              as={NavLink}
              to="/"
              className={styles.navLink}
              activeClassName={styles.activeNavLink}
              end
              onClick={() => setExpanded(false)}
            >
              Home
            </Nav.Link>

            {currentUser && (
              <>
                {/* Profile Link */}
                <Nav.Link
                  as={NavLink}
                  to="/profile"
                  className={styles.navLink}
                  activeClassName={styles.activeNavLink}
                  onClick={() => setExpanded(false)}
                >
                  Profile
                </Nav.Link>

                {/* Analytics Dropdown */}
                <NavDropdown
                  title="Analytics"
                  id="analytics-dropdown"
                  className={styles.navLink}
                  onClick={() => setExpanded(false)}
                >
                  <NavDropdown.Item
                    as={NavLink}
                    to="/mood-analytics"
                    className={`${styles.navLink} ${
                      location.pathname === "/mood-analytics"
                        ? styles.activeNavLink
                        : ""
                    }`}
                    onClick={() => setExpanded(false)}
                  >
                    Mood Analytics
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    as={NavLink}
                    to="/post-performance"
                    className={`${styles.navLink} ${
                      location.pathname === "/post-performance"
                        ? styles.activeNavLink
                        : ""
                    }`}
                    onClick={() => setExpanded(false)}
                  >
                    Post Performance
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}

            {/* Authentication Links */}
            {!currentUser ? (
              <>
                <Nav.Link
                  as={NavLink}
                  to="/login"
                  className={styles.navLink}
                  activeClassName={styles.activeNavLink}
                  onClick={() => setExpanded(false)}
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/signup"
                  className={styles.navLink}
                  activeClassName={styles.activeNavLink}
                  onClick={() => setExpanded(false)}
                >
                  Sign Up
                </Nav.Link>
              </>
            ) : (
              <Nav.Link
                onClick={() => {
                  handleLogout();
                  setExpanded(false);
                }}
                className={styles.navLink}
              >
                Logout
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
