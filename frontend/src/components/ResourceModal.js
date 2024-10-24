import React, { useState, useEffect } from "react";
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap";

// All available resources
const allResources = [
  { name: "Self-Harm UK", url: "https://www.selfharm.co.uk/" },
  { name: "Harmless", url: "https://harmless.org.uk/" },
  { name: "National Self-Harm Network", url: "https://www.nshn.co.uk/" },
  { name: "Samaritans", url: "https://www.samaritans.org" },
  { name: "Pieta House (Ireland)", url: "https://www.pieta.ie/" },
  { name: "Campaign Against Living Miserably (CALM)", url: "https://www.thecalmzone.net/" },
  { name: "National Suicide Prevention Lifeline (UK)", url: "https://www.nspa.org.uk/" },
  { name: "Mind", url: "https://www.mind.org.uk/" },
  { name: "Mental Health Ireland", url: "https://www.mentalhealthireland.ie/" },
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
      }, 1000); // 1 second delay to simulate fetching
    }
  }, [show]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Helpful Resources</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <ListGroup>
            {allResources.map((resource, index) => (
              <ListGroup.Item key={index}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.name}
                </a>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResourceModal;
