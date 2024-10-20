import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LikeButton from './LikeButton';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { Card, Button, Form, Alert, Spinner, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchProfilePicUrl } from '../utils/fetchProfilePic';

const Post = ({ post }) => {
  const { currentUser } = useAuth();
  const isOwnPost = currentUser && post.userId && currentUser.uid === post.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');

  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(post.userId, post.isAnonymous);
      setProfilePicUrl(url);
    };

    if (post.userId) {
      fetchProfilePic();
    }
  }, [post.userId, post.isAnonymous]);

  useEffect(() => {
    const commentsRef = collection(firestore, 'Posts', post.id, 'Comments');
    const q = query(commentsRef, orderBy('created_at', 'asc')); // Order comments by creation time

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() });
      });
      setComments(commentsData);
    }, (error) => {
      console.error('Error fetching comments:', error);
    });

    return () => unsubscribe();
  }, [post.id]);

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
        content_lower: editedContent.toLowerCase(), // Update the lowercase content
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
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error deleting post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {isEditing ? (
          <Form onSubmit={handleEdit}>
            <Form.Group controlId="editContent">
              <Form.Control
                as="textarea"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows="3"
                required
              />
            </Form.Group>
            <Button type="submit" variant="success" disabled={loading} className="mt-2">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
            </Button>
            <Button variant="secondary" className="mt-2 ms-2" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Form>
        ) : (
          <>
            <div className="d-flex align-items-center mb-2">
              <Image
                src={profilePicUrl}
                roundedCircle
                width={40}
                height={40}
                className="me-2"
              />
              <Card.Subtitle className="text-muted">
                <strong>
                  {post.isAnonymous ? 'Anonymous' : (
                    <Link to={`/users/${post.userId}`} className="text-decoration-none">
                      {post.username}
                    </Link>
                  )}
                </strong> | <em>{post.created_at?.toDate().toLocaleString()}</em>
              </Card.Subtitle>
            </div>
            <Card.Text>{post.content}</Card.Text>

            {/* Display Image if available */}
            {post.imageUrl && (
              <div className="mb-3">
                <Image src={post.imageUrl} alt="Post Image" fluid rounded />
              </div>
            )}

            <Card.Text className="text-muted">
              <strong>Mood:</strong> {post.mood}
            </Card.Text>

            {/* Like Button */}
            <LikeButton postId={post.id} />

            {isOwnPost && (
              <div className="mt-3">
                <Button variant="warning" onClick={() => setIsEditing(true)} className="me-2">
                  Edit
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Delete'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Comments Section */}
        <div className="mt-4">
          <h4>Comments</h4>
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={post.id} />
            ))
          )}
          {currentUser && <CommentForm postId={post.id} />}
        </div>
      </Card.Body>
    </Card>
  );
};

export default Post;
