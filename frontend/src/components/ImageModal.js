import React from "react";
import { Modal, Image } from "react-bootstrap";
import PropTypes from "prop-types";

const ImageModal = ({ show, handleClose, imageUrl, altText = "Image" }) => {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      contentClassName="bg-transparent border-0" // Custom class for transparency
      dialogClassName="image-modal-dialog"
    >
      <Modal.Body
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh", backgroundColor: "rgba(0, 0, 0, 0)" }} // background overlay
      >
        <Image
          src={imageUrl}
          alt={altText}
          fluid
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />
      </Modal.Body>
    </Modal>
  );
};

ImageModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  altText: PropTypes.string,
};

export default ImageModal;
