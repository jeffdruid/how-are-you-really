import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

const fetchDefaultProfilePicUrl = async () => {
  const storage = getStorage(); // Initialize Firebase Storage
  const profilePicRef = ref(storage, 'default_profile.jpg'); // Reference to the image in storage
  try {
    const url = await getDownloadURL(profilePicRef); // Get the download URL
    return url;
  } catch (err) {
    console.error('Error fetching default profile picture:', err);
    return null;
  }
};

const Comment = ({ comment, postId }) => {
  const { currentUser } = useAuth();
  const isOwnComment = currentUser && comment.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');

  useEffect(() => {
    const fetchProfilePic = async () => {
      try {
        if (comment.isAnonymous) {
          const defaultUrl = await fetchDefaultProfilePicUrl();
          setProfilePicUrl(defaultUrl);
        } else {
          const userDocRef = doc(firestore, 'Users', comment.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfilePicUrl(userDoc.data().profilePicUrl || await fetchDefaultProfilePicUrl());
          } else {
            const defaultUrl = await fetchDefaultProfilePicUrl();
            setProfilePicUrl(defaultUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching profile picture:', err);
        const defaultUrl = await fetchDefaultProfilePicUrl();
        setProfilePicUrl(defaultUrl);
      }
    };
  
    if (comment.userId) {
      fetchProfilePic();
    }
  }, [comment.userId, comment.isAnonymous]);
  

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
    <div className="mt-3">
      {error && <Alert variant="danger">{error}</Alert>}

      {isEditing ? (
        <Form onSubmit={handleEdit}>
          <Form.Group controlId={`editComment-${comment.id}`}>
            <Form.Control
              as="textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={2}
              required
            />
          </Form.Group>
          <Button
            type="submit"
            variant="primary"
            className="mt-2 me-2"
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
          </Button>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          <div className="d-flex align-items-center mb-2">
            {profilePicUrl && (
              <Image
                src={profilePicUrl}
                roundedCircle
                width={30}
                height={30}
                className="me-2"
              />
            )}
            <strong>{comment.isAnonymous ? 'Anonymous' : comment.username}</strong> |{' '}
            <em>{comment.created_at?.toDate().toLocaleString()}</em>
          </div>
          <p>{comment.content}</p>

          {isOwnComment && (
            <div>
              <Button
                variant="warning"
                className="me-2"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Delete'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Comment;
