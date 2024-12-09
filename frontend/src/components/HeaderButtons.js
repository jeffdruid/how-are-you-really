import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSun, BsMoon, BsArrowLeft } from "react-icons/bs";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../contexts/AuthContext"; // Import Auth Context
import styles from "../styles/HeaderButtons.module.css";

const HeaderButtons = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Access current user details

  // Load dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);

  // Apply dark mode class to body and toggle overlay
  useEffect(() => {
    const overlay = document.getElementById("dark-mode-overlay");
    if (darkMode) {
      if (!overlay) {
        const darkOverlay = document.createElement("div");
        darkOverlay.id = "dark-mode-overlay";
        darkOverlay.classList.add("dark-mode-overlay");
        document.body.appendChild(darkOverlay);
      }
    } else {
      overlay && overlay.remove();
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Go back handler
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div
      className={styles.headerButtons}
      style={{ position: "sticky", top: 55, zIndex: 1000 }}
    >
      <Button
        variant="outline-secondary"
        onClick={handleGoBack}
        className={`${styles.button} ${styles.backButton}`}
      >
        <BsArrowLeft />
      </Button>
      {currentUser && ( // Render the SearchBar only if the user is logged in
        <div className={styles.searchBarContainer}>
          <SearchBar />
        </div>
      )}
      <Button
        variant="outline-secondary"
        onClick={toggleDarkMode}
        className={`${styles.button} ${styles.darkModeButton}`}
      >
        {darkMode ? <BsSun /> : <BsMoon />}
      </Button>
    </div>
  );
};

export default HeaderButtons;
