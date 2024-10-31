import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSun, BsMoon, BsArrowLeft } from "react-icons/bs";
import styles from "../styles/HeaderButtons.module.css";

const HeaderButtons = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Load dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
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
    <div className={styles.headerButtons} style={{ position: "sticky", top: 55, zIndex: 1000 }}>
      <Button
        variant="outline-secondary"
        onClick={toggleDarkMode}
        className={styles.button}
      >
        {darkMode ? <BsSun /> : <BsMoon />}
      </Button>
      <Button
        variant="outline-secondary"
        onClick={handleGoBack}
        className={styles.button}
      >
        <BsArrowLeft />
      </Button>
    </div>
  );
};

export default HeaderButtons;
