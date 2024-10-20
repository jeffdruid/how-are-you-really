import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../firebase';
import { collection, setDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Alert, Spinner, Collapse } from 'react-bootstrap';
import ImageUploader from './ImageUploader';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('happy');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for image upload
  const [images, setImages] = useState(null);
  const [uploading, setUploading] = useState(false);

  // State to control form visibility
  const [open, setOpen] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch username from Firestore when component mounts
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userDocRef = doc(firestore, 'Users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || 'Anonymous');
        } else {
          setUsername('Anonymous'); // Fallback if user document doesn't exist
        }
      } catch (err) {
        console.error('Error fetching username:', err);
        setUsername('Anonymous'); // Fallback on error
      }
    };

    if (currentUser) {
      fetchUsername();
    }
  }, [currentUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSuccess(false);

    // Basic validation
    if (content.trim() === '') {
      setError('Post content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create a new post document to get a unique postId
      const newPostRef = doc(collection(firestore, 'Posts')); // Generate a new post reference
      await setDoc(newPostRef, {
        userId: currentUser.uid, // Always set userId to currentUser.uid
        username: isAnonymous ? 'Anonymous' : username, // Set username based on isAnonymous
        content,
        content_lower: content.toLowerCase(), // For case-insensitive search
        mood,
        isAnonymous,
        likeCount: 0, // Initialize likeCount
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        imageUrl: null, // Initialize imageUrl as null
        thumbnailUrl: null, // Initialize thumbnailUrl as null
      });

      const postId = newPostRef.id; // Get the generated postId

      if (images) {
        setUploading(true);

        // Upload original image
        const originalRef = ref(storage, `post_images/${postId}/original_${images.original.name}`);
        await uploadBytes(originalRef, images.original);
        const originalURL = await getDownloadURL(originalRef);

        // Upload thumbnail image
        const thumbnailRef = ref(storage, `post_images/${postId}/thumbnail_${images.thumbnail.name}`);
        await uploadBytes(thumbnailRef, images.thumbnail);
        const thumbnailURL = await getDownloadURL(thumbnailRef);

        // Update the post document with image URLs
        await updateDoc(newPostRef, {
          imageUrl: originalURL,
          thumbnailUrl: thumbnailURL,
          updated_at: serverTimestamp(),
        });

        setUploading(false);
      }

      // Reset form fields
      setContent('');
      setMood('happy');
      setIsAnonymous(false);
      setImages(null);

      // Collapse the form
      setOpen(false);

      // Show success message
      setShowSuccess(true);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Create a New Post</h3>

      {/* Success Message */}
      {showSuccess && (
        <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
          Post created successfully!
        </Alert>
      )}

      {/* Error Message */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Toggle Button for Form */}
      <Button
        onClick={() => setOpen(!open)}
        aria-controls="create-post-form"
        aria-expanded={open}
        variant="secondary"
        className="mb-3"
      >
        {open ? 'Hide Post Form' : 'Show Post Form'}
      </Button>

      {/* Collapsible Form */}
      <Collapse in={open}>
        <div id="create-post-form">
          <Form onSubmit={handleCreatePost}>
            <Form.Group className="mb-3" controlId="postContent">
              <Form.Control
                as="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                required
              />
            </Form.Group>

            {/* Image Upload Component */}
            <ImageUploader
              onImageSelected={(files) => setImages(files)}
              maxSize={5 * 1024 * 1024} // 5MB
              accept="image/*"
            />

            {/* Display upload progress */}
            {uploading && (
              <div className="mt-3">
                <Spinner animation="border" size="sm" /> Uploading image...
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Mood:</Form.Label>
              <Form.Select
                className="bg-dark text-light"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option value="happy">😊 Happy</option>
                <option value="sad">😢 Sad</option>
                <option value="anxious">😟 Anxious</option>
                {/* Add more moods as needed */}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="postAnonymously">
              <Form.Check
                type="checkbox"
                label="Post Anonymously"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading || uploading} block>
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </Form>
        </div>
      </Collapse>
    </div>
  );
};

export default CreatePost;
