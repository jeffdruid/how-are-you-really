import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';

const CommentForm = ({ postId }) => {
  const { currentUser, username } = useAuth(); // Destructure username from context
  const [commentContent, setCommentContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false); // Added state for anonymity
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (commentContent.trim() === '') {
      setError('Comment cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(firestore, 'Posts', postId, 'Comments'), {
        userId: currentUser.uid, // Associate comment with user
        username: isAnonymous ? 'Anonymous' : username, // Set username based on anonymity
        content: commentContent,
        isAnonymous, // Store the anonymity flag
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setCommentContent('');
      setIsAnonymous(false);
      console.log('Comment added successfully');
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleAddComment}>
        <Form.Group controlId="commentContent">
          <Form.Control
            as="textarea"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            required
          />
        </Form.Group>
        <Form.Group className="mt-2">
          <Form.Check
            type="checkbox"
            label="Post Anonymously"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
        </Form.Group>
        <Button type="submit" variant="success" className="mt-3" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Post Comment'}
        </Button>
      </Form>
    </div>
  );
};

export default CommentForm;
