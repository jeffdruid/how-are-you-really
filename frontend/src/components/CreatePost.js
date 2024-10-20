import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, setDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Alert } from 'react-bootstrap';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('happy');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const newPostRef = doc(collection(firestore, 'Posts')); // Generate a new post reference
      await setDoc(newPostRef, {
        userId: currentUser.uid, // Always set userId to currentUser.uid
        username: isAnonymous ? 'Anonymous' : username, // Set username based on isAnonymous
        content,
        mood,
        isAnonymous,
        likeCount: 0, // Initialize likeCount
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setContent('');
      setMood('happy');
      setIsAnonymous(false);
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
        <Button type="submit" variant="primary" disabled={loading} block>
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </Form>
    </div>
  );
};

export default CreatePost;
