import React from 'react';
import { Modal, Image } from 'react-bootstrap';
import PropTypes from 'prop-types';

const ImageModal = ({ show, handleClose, imageUrl, altText }) => {
  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Body className="p-0">
        <Image src={imageUrl} alt={altText} fluid />
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

ImageModal.defaultProps = {
  altText: 'Image',
};

export default ImageModal;
