import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchProfilePicUrl } from '../utils/fetchProfilePic';
import Reply from './Reply';
import LikeButton from './LikeButton'; // Import the LikeButton component

const Comment = ({ comment, postId }) => {
  const { currentUser } = useAuth();
  const isOwnComment = currentUser && comment.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [replies, setReplies] = useState([]); // State for nested replies
  const [replyContent, setReplyContent] = useState(''); // New reply content

  // Fetch the user's profile picture URL
  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(comment.userId, comment.isAnonymous);
      setProfilePicUrl(url);
    };

    if (comment.userId) {
      fetchProfilePic();
    }
  }, [comment.userId, comment.isAnonymous]);
  // Fetch replies for this comment, ordered by creation time
  useEffect(() => {
    const repliesRef = collection(firestore, 'Posts', postId, 'Comments', comment.id, 'Replies');
    const q = query(repliesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = [];
      snapshot.forEach((doc) => {
        repliesData.push({ id: doc.id, ...doc.data() });
      });
      setReplies(repliesData);
    }, (error) => {
      console.error('Error fetching replies:', error);
    });

    return () => unsubscribe();
  }, [postId, comment.id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setLoading(true);

    const repliesRef = collection(firestore, 'Posts', postId, 'Comments', comment.id, 'Replies');
    try {
      await addDoc(repliesRef, {
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email,
        content: replyContent,
        isAnonymous: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setReplyContent('');
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
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
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
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
            <Link to={`/users/${comment.userId}`} className="text-decoration-none">
            {profilePicUrl && (
              <Image
                src={profilePicUrl}
                loading="lazy"
                roundedCircle
                width={30}
                height={30}
                className="me-2"
              />
            )}
            <strong>
              {comment.isAnonymous ? 'Anonymous' : comment.username}
            </strong> |{' '}
            </Link>
            <em>{comment.created_at?.toDate().toLocaleString()}</em>
          </div>
          <p>{comment.content}</p>

          {/* Like Button for Comment */}
          <LikeButton postId={postId} commentId={comment.id} />

          {/* Nested replies */}
          {replies.length > 0 && (
            <div style={{ marginLeft: '20px' }}>
              {replies.map((reply) => (
                <Reply key={reply.id} reply={reply} postId={postId} commentId={comment.id} />
              ))}
            </div>
          )}

          {/* Reply Form */}
          <Form onSubmit={handleReply}>
            <Form.Group controlId={`reply-${comment.id}`}>
              <Form.Control
                as="textarea"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={1}
                placeholder="Add a reply..."
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className="mt-2"
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Reply'}
            </Button>
          </Form>

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
