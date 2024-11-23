import React from "react";
import { Modal, ProgressBar } from "react-bootstrap";

const ProgressModal = ({ show, progress, message }) => {
  return (
    <Modal show={show} centered>
      <Modal.Header>
        <Modal.Title>Updating...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
        <ProgressBar now={progress} label={`${progress}%`} animated />
      </Modal.Body>
    </Modal>
  );
};

export default ProgressModal;
