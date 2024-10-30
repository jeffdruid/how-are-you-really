import React, { useState, useEffect } from "react";
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
      expand="lg"
      bg="light"
      variant="light"
      sticky="top"
      className={`shadow-sm ${styles.navbarContainer}`}
    >
      <Container fluid className="justify-content-between">
        {/* Brand */}
        <Navbar.Brand as={NavLink} to="/" className={styles.brand}>
          How Are You Really
        </Navbar.Brand>

        {/* Notification Icon */}
        {currentUser && (
          <Nav.Link
            as={NavLink}
            to="/notifications"
            className={styles.notificationIcon}
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
        <Navbar.Toggle aria-controls="navbar-nav" />

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
                >
                  Profile
                </Nav.Link>

                {/* Analytics Dropdown */}
                <NavDropdown
                  title="Analytics"
                  id="analytics-dropdown"
                  className={styles.navLink}
                >
                  <NavDropdown.Item
                    as={NavLink}
                    to="/mood-analytics"
                    className={`${styles.navLink} ${
                      location.pathname === "/mood-analytics"
                        ? styles.activeNavLink
                        : ""
                    }`}
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
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/signup"
                  className={styles.navLink}
                  activeClassName={styles.activeNavLink}
                >
                  Sign Up
                </Nav.Link>
              </>
            ) : (
              <Nav.Link onClick={handleLogout} className={styles.navLink}>
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
