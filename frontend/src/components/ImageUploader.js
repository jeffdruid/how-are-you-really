import React, { useState } from 'react';
import { Form, Alert, Image } from 'react-bootstrap';
import PropTypes from 'prop-types';

const ImageUploader = ({ onImageSelected, maxSize = 5 * 1024 * 1024, accept = 'image/*' }) => {
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (e) => {
    setError('');
    const file = e.target.files[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        setPreviewUrl('');
        onImageSelected(null);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(`Image size should be less than ${maxSize / (1024 * 1024)}MB.`);
        setPreviewUrl('');
        onImageSelected(null);
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      onImageSelected(file);
    } else {
      setPreviewUrl('');
      onImageSelected(null);
    }
  };

  return (
    <div>
      <Form.Group controlId="imageUpload">
        <Form.Label>Attach Image</Form.Label>
        <Form.Control
          type="file"
          accept={accept}
          onChange={handleImageChange}
        />
        <Form.Text className="text-muted">
          Maximum size: {maxSize / (1024 * 1024)}MB.
        </Form.Text>
      </Form.Group>

      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

      {previewUrl && (
        <div className="mt-3">
          <h6>Image Preview:</h6>
          <Image src={previewUrl} alt="Selected Image" fluid rounded />
        </div>
      )}
    </div>
  );
};

ImageUploader.propTypes = {
  onImageSelected: PropTypes.func.isRequired,
  maxSize: PropTypes.number,
  accept: PropTypes.string,
};

export default ImageUploader;
