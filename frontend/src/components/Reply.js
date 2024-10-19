import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { fetchProfilePicUrl } from '../utils/fetchProfilePic';
import { useAuth } from '../contexts/AuthContext';

const Reply = ({ reply, postId, commentId }) => {
  const { currentUser } = useAuth();
  const isOwnReply = currentUser && reply.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');

  // Fetch the user's profile picture URL
  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(reply.userId, false);
      setProfilePicUrl(url);
    };

    if (reply.userId) {
      fetchProfilePic();
    }
  }, [reply.userId]);

  const handleEditReply = async (e) => {
    e.preventDefault();
    setLoading(true);

    const replyRef = doc(firestore, 'Posts', postId, 'Comments', commentId, 'Replies', reply.id);
    
    try {
      await updateDoc(replyRef, {
        content: editedContent,
        updated_at: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating reply:', err);
      setError('Failed to update reply.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmDelete) return;

    setLoading(true);
    const replyRef = doc(firestore, 'Posts', postId, 'Comments', commentId, 'Replies', reply.id);

    try {
      await deleteDoc(replyRef);
      console.log('Reply deleted:', reply.id);
    } catch (err) {
      console.error('Error deleting reply:', err);
      setError('Failed to delete reply.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 mb-2">
      {error && <Alert variant="danger">{error}</Alert>}

      {isEditing ? (
        <Form onSubmit={handleEditReply}>
          <Form.Group controlId={`editReply-${reply.id}`}>
            <Form.Control
              as="textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={1}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="mt-2 me-2" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
          </Button>
          <Button variant="secondary" className="mt-2" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          <div className="d-flex align-items-center">
            <Image
              src={profilePicUrl}
              roundedCircle
              width={20}
              height={20}
              className="me-2"
            />
            <strong>{reply.username}</strong> |{' '}
            <em>{reply.created_at?.toDate().toLocaleString()}</em>
          </div>
          <p>{reply.content}</p>
          {isOwnReply && (
            <>
              <Button variant="warning" className="me-2" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteReply} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Delete'}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reply;
