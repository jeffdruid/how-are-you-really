import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Form, Button, Spinner, Alert, Image } from 'react-bootstrap';
import { fetchProfilePicUrl } from '../utils/fetchProfilePic';

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
  const [editingReplyId, setEditingReplyId] = useState(null); // Track editing state for replies
  const [editedReplyContent, setEditedReplyContent] = useState(''); // Store edited reply content

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
    const q = query(repliesRef, orderBy('created_at', 'asc')); // Order by creation time
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
    setLoading(true); // Set loading during reply submission

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
      setLoading(false); // End loading after reply is submitted
    }
  };

  const handleEditReply = async (e, replyId) => {
    e.preventDefault();
    setLoading(true); // Set loading during reply edit

    const replyRef = doc(firestore, 'Posts', postId, 'Comments', comment.id, 'Replies', replyId);
    
    try {
      await updateDoc(replyRef, {
        content: editedReplyContent,
        updated_at: serverTimestamp(),
      });
      setEditingReplyId(null); // Close the edit form after saving
    } catch (err) {
      console.error('Error updating reply:', err);
    } finally {
      setLoading(false); // End loading after reply is edited
    }
  };

  const handleDeleteReply = async (replyId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this reply?');
    if (!confirmDelete) return;

    setLoading(true); // Set loading during reply deletion
    const replyRef = doc(firestore, 'Posts', postId, 'Comments', comment.id, 'Replies', replyId);
    
    try {
      await deleteDoc(replyRef);
      console.log('Reply deleted:', replyId);
    } catch (err) {
      console.error('Error deleting reply:', err);
    } finally {
      setLoading(false); // End loading after reply is deleted
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

          {/* Nested replies */}
          {replies.length > 0 && (
            <div style={{ marginLeft: '20px' }}>
              {replies.map((reply) => (
                <div key={reply.id} className="mb-2">
                  {editingReplyId === reply.id ? (
                    <Form onSubmit={(e) => handleEditReply(e, reply.id)}>
                      <Form.Group controlId={`editReply-${reply.id}`}>
                        <Form.Control
                          as="textarea"
                          value={editedReplyContent}
                          onChange={(e) => setEditedReplyContent(e.target.value)}
                          rows={1}
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
                        onClick={() => setEditingReplyId(null)}
                      >
                        Cancel
                      </Button>
                    </Form>
                  ) : (
                    <>
                      <div className="d-flex align-items-center">
                        <Image
                          src={profilePicUrl} // Fetch user's profile pic for replies if needed
                          roundedCircle
                          width={20}
                          height={20}
                          className="me-2"
                        />
                        <strong>{reply.username}</strong> |{' '}
                        <em>{reply.created_at?.toDate().toLocaleString()}</em>
                      </div>
                      <p>{reply.content}</p>
                      {currentUser.uid === reply.userId && (
                        <>
                          <Button
                            variant="warning"
                            className="me-2"
                            size="sm"
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditedReplyContent(reply.content);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteReply(reply.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
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
