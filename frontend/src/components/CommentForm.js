import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';

const CommentForm = ({ postId, postOwnerId }) => {
  const { currentUser, username } = useAuth();
  const [commentContent, setCommentContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Post Owner ID:', postOwnerId);
  }, [postOwnerId]);

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
      // Add the comment to Firestore
      const commentRef = await addDoc(collection(firestore, 'Posts', postId, 'Comments'), {
        userId: currentUser.uid,
        username: isAnonymous ? 'Anonymous' : username,
        content: commentContent,
        isAnonymous,
        likeCount: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
  
      console.log('Comment added successfully:', commentRef.id);
  
      // Ensure postOwnerId is passed correctly and notification logic is correct
      if (postOwnerId) {
        if (currentUser.uid !== postOwnerId) {
          console.log('Sending notification to post owner:', postOwnerId);
          const notificationsRef = collection(firestore, 'Users', postOwnerId, 'Notifications');
          await addDoc(notificationsRef, {
            type: 'comment',
            fromUserId: currentUser.uid,
            postId,
            commentId: commentRef.id,
            created_at: serverTimestamp(),
            read: false,
          });
          console.log('Notification sent to post owner:', postOwnerId);
        } else {
          console.log('The commenter is the post owner. No notification sent.');
        }
      } else {
        console.log('postOwnerId is missing.');
      }
      
  
      setCommentContent('');
      setIsAnonymous(false);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error adding comment or notification:', err);
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
