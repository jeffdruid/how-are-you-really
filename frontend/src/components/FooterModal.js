import React from "react";
import { Modal, Button } from "react-bootstrap";

function FooterModal({ type, onClose }) {
  const getContent = () => {
    switch (type) {
      case "about":
        return {
          title: "About How Are You Really",
          body: (
            <p>
              "How Are You Really" provides a safe space for individuals to
              express their true feelings and connect with a supportive
              community.
            </p>
          ),
        };
      case "contact":
        return {
          title: "Contact Us",
          body: (
            <>
              <p>Reach out with questions or feedback at:</p>
              <p>Email: support@howareyoureally.com</p>
            </>
          ),
        };
      case "privacy":
        return {
          title: "Privacy Policy",
          body: (
            <p>
              We value your privacy and are committed to protecting your
              personal information while ensuring a secure experience.
            </p>
          ),
        };
      case "terms":
        return {
          title: "Terms of Service",
          body: (
            <p>
              By using "How Are You Really," you agree to follow our community
              guidelines and terms of service.
            </p>
          ),
        };
      default:
        return { title: "", body: null };
    }
  };

  const { title, body } = getContent();

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FooterModal;
