import React, { useState } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';

const Comment = ({ comment, postId }) => {
  const { currentUser } = useAuth();
  const isOwnComment = currentUser && comment.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (editedContent.trim() === '') {
      setError('Comment cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const commentRef = doc(firestore, 'Posts', postId, 'Comments', comment.id);
      await updateDoc(commentRef, {
        content: editedContent,
        updated_at: serverTimestamp(),
      });
      setIsEditing(false);
      console.log('Comment updated successfully:', comment.id);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error updating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmDelete) return;

    setLoading(true);
    setError('');

    try {
      const commentRef = doc(firestore, 'Posts', postId, 'Comments', comment.id);
      await deleteDoc(commentRef);
      console.log('Comment deleted successfully:', comment.id);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error deleting comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.commentContainer}>
      {error && <p style={styles.errorText}>{error}</p>}

      {isEditing ? (
        <form onSubmit={handleEdit}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows="2"
            required
            style={styles.textarea}
          ></textarea>
          <button type="submit" disabled={loading} style={styles.saveButton}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => setIsEditing(false)} style={styles.cancelButton}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <p style={styles.content}>{comment.content}</p>
          <p style={styles.meta}>
            <strong>{comment.isAnonymous ? 'Anonymous' : comment.username}</strong> | <em>{comment.created_at?.toDate().toLocaleString()}</em>
          </p>

          {isOwnComment && (
            <div style={styles.buttonGroup}>
              <button onClick={() => setIsEditing(true)} style={styles.editButton}>Edit</button>
              <button onClick={handleDelete} disabled={loading} style={styles.deleteButton}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Simple inline styles (can be adjusted or removed)
const styles = {
  commentContainer: {
    borderTop: '1px solid #eee',
    paddingTop: '10px',
    marginTop: '10px',
  },
  content: {
    fontSize: '14px',
    marginBottom: '5px',
  },
  meta: {
    fontSize: '12px',
    color: '#555',
    marginBottom: '5px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    padding: '3px 7px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '3px 7px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  saveButton: {
    padding: '5px 10px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  cancelButton: {
    padding: '5px 10px',
    backgroundColor: '#bbb',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    resize: 'vertical',
    marginBottom: '5px',
  },
  errorText: {
    color: 'red',
    marginBottom: '5px',
  },
};

export default Comment;
