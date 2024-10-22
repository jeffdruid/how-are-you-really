import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const GoBackButton = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  return (
    <Button variant="secondary" onClick={handleGoBack} className="mb-3">
      Go Back
    </Button>
  );
};

export default GoBackButton;
