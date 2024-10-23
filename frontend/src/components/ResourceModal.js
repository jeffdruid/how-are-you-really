import React, { useState, useEffect } from "react";
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap";

// Resources mapped to flagged content categories
const resources = {
  selfHarm: [
    { name: "Self-Harm UK", url: "https://www.selfharm.co.uk/" },
    { name: "Harmless", url: "https://harmless.org.uk/" },
    { name: "National Self-Harm Network", url: "https://www.nshn.co.uk/" },
  ],
  suicide: [
    { name: "Samaritans", url: "https://www.samaritans.org" },
    { name: "Pieta House (Ireland)", url: "https://www.pieta.ie/" },
    { name: "Campaign Against Living Miserably (CALM)", url: "https://www.thecalmzone.net/" },
    { name: "National Suicide Prevention Lifeline (UK)", url: "https://www.nspa.org.uk/" },
  ],
  depression: [
    { name: "Mind", url: "https://www.mind.org.uk/" },
    { name: "Mental Health Ireland", url: "https://www.mentalhealthireland.ie/" },
    { name: "YoungMinds", url: "https://www.youngminds.org.uk/" },
    { name: "Aware (Ireland)", url: "https://www.aware.ie/" },
  ],
};

// Helper function to get the appropriate resources based on flagged type
const getResourcesForType = (flaggedType) => {
  if (flaggedType.includes("suicide")) return resources.suicide;
  if (flaggedType.includes("self-harm")) return resources.selfHarm;
  if (flaggedType.includes("depression")) return resources.depression;
  return [];
};

const ResourceModal = ({ show, handleClose, flaggedType }) => {
  const [loading, setLoading] = useState(true);
  const [resourceList, setResourceList] = useState([]);

  useEffect(() => {
    if (show && flaggedType) {
      setLoading(true);

      // Simulate a delay to fetch resources
      setTimeout(() => {
        const fetchedResources = getResourcesForType(flaggedType);
        setResourceList(fetchedResources);
        setLoading(false);
      }, 1000); // 1 second delay to simulate fetching
    }
  }, [show, flaggedType]);

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
        ) : resourceList.length > 0 ? (
          <ListGroup>
            {resourceList.map((resource, index) => (
              <ListGroup.Item key={index}>
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.name}
                </a>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p>No resources available for this topic.</p>
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
