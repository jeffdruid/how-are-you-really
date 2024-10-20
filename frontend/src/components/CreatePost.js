import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../firebase';
import { collection, setDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import ImageUploader from './ImageUploader'; // Import the ImageUploader component

const CreatePost = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('happy');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for image upload
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      });

      const postId = newPostRef.id; // Get the generated postId

      let imageUrl = null;

      if (image) {
        setUploading(true);

        // Create a unique file name using postId and image name
        const imageRef = ref(storage, `post_images/${postId}/${image.name}`);

        // Upload the image
        const uploadTask = await uploadBytes(imageRef, image);

        // Get the download URL
        imageUrl = await getDownloadURL(uploadTask.ref);

        setUploading(false);

        // Update the post document with the image URL
        await updateDoc(newPostRef, {
          imageUrl,
          updated_at: serverTimestamp(),
        });
      }

      // Reset form fields
      setContent('');
      setMood('happy');
      setIsAnonymous(false);
      setImage(null);
      console.log('Post created successfully');
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
      {error && <Alert variant="danger">{error}</Alert>}
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
          onImageSelected={(file) => setImage(file)}
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
  );
};

export default CreatePost;
