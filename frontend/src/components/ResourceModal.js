import React, { useState, useEffect } from "react";
import { Modal, ListGroup, Spinner } from "react-bootstrap";
import { FiExternalLink } from "react-icons/fi";

// All available resources
const allResources = [
  { name: "Self-Harm UK", url: "https://www.selfharm.co.uk/" },
  { name: "Harmless", url: "https://harmless.org.uk/" },
  { name: "National Self-Harm Network", url: "https://www.nshn.co.uk/" },
  { name: "Samaritans", url: "https://www.samaritans.org" },
  { name: "Pieta House (Ireland)", url: "https://www.pieta.ie/" },
  {
    name: "Campaign Against Living Miserably (CALM)",
    url: "https://www.thecalmzone.net/",
  },
  {
    name: "National Suicide Prevention Lifeline (UK)",
    url: "https://www.nspa.org.uk/",
  },
  { name: "Mind", url: "https://www.mind.org.uk/" },
  {
    name: "Mental Health Ireland",
    url: "https://www.mentalhealthireland.ie/",
  },
  { name: "YoungMinds", url: "https://www.youngminds.org.uk/" },
  { name: "Aware (Ireland)", url: "https://www.aware.ie/" },
];

const ResourceModal = ({ show, handleClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      setLoading(true);

      // Simulate a delay to fetch resources
      setTimeout(() => {
        setLoading(false);
      }, 1000); // Simulate delay
    }
  }, [show]);

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>Helpful Resources</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-center text-muted mb-4">
          We’re here to help. Below are some resources where you can find
          support and guidance.
        </p>
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100px" }}
          >
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <ListGroup variant="flush">
            {allResources.map((resource, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex justify-content-between align-items-center p-3"
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  marginBottom: "8px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none text-dark"
                  style={{ fontWeight: "500" }}
                  onClick={handleClose} // Close modal on link click
                >
                  {resource.name}
                </a>
                <FiExternalLink size={18} className="text-secondary" />
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ResourceModal;
