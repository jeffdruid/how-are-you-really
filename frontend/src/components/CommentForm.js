import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';

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
    <div style={styles.commentFormContainer}>
      {error && <p style={styles.errorText}>{error}</p>}
      <form onSubmit={handleAddComment}>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Add a comment..."
          rows="2"
          required
          style={styles.textarea}
        ></textarea>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Post Anonymously
          </label>
        </div>
        <button type="submit" disabled={loading} style={styles.submitButton}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};

// Simple inline styles (can be adjusted or removed)
const styles = {
  commentFormContainer: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    resize: 'vertical',
    marginBottom: '5px',
  },
  submitButton: {
    padding: '5px 10px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  errorText: {
    color: 'red',
    marginBottom: '5px',
  },
};

export default CommentForm;
