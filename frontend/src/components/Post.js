import React, { useState } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';

const Post = ({ post }) => {
  const { currentUser } = useAuth();
  
  // Debugging: Log currentUser and post data
  console.log('Current User:', currentUser);
  console.log('Post Data:', post);

  // Enhanced ownership logic
  const isOwnPost = currentUser && post.userId && currentUser.uid === post.userId;

  // Debugging: Log ownership status
  console.log('Is Own Post:', isOwnPost);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (editedContent.trim() === '') {
      setError('Post content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const postRef = doc(firestore, 'Posts', post.id);
      await updateDoc(postRef, {
        content: editedContent,
        updated_at: serverTimestamp(),
      });
      setIsEditing(false);
      console.log('Post updated successfully:', post.id);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error updating post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;

    setLoading(true);
    setError('');

    try {
      const postRef = doc(firestore, 'Posts', post.id);
      await deleteDoc(postRef);
      console.log('Post deleted successfully:', post.id);
      // No need to manually remove the post from UI as real-time listener handles it
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error deleting post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.postContainer}>
      {error && <p style={styles.errorText}>{error}</p>}
      
      {isEditing ? (
        <form onSubmit={handleEdit}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows="3"
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
          <p style={styles.content}>{post.content}</p>
          <p style={styles.meta}>
            <strong>Mood:</strong> {post.mood} | <strong>Author:</strong> {post.isAnonymous ? 'Anonymous' : post.username} | <em>{post.created_at?.toDate().toLocaleString()}</em>
          </p>
          
          {isOwnPost && (
            <div style={styles.buttonGroup}>
              <button onClick={() => setIsEditing(true)} style={styles.editButton}>Edit</button>
              <button onClick={handleDelete} disabled={loading} style={styles.deleteButton}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
          
          {/* Add Like and Comment functionalities here */}
        </>
      )}
    </div>
  );
};

// TODO Remove from here
const styles = {
  postContainer: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '10px',
    backgroundColor: '#fff',
  },
  content: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  meta: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '10px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
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
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    resize: 'vertical',
  },
  errorText: {
    color: 'red',
    marginBottom: '10px',
  },
};

export default Post;
