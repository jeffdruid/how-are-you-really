import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import LikeButton from "./LikeButton";
import Comment from "./Comment";
import CommentForm from "./CommentForm";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import {
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Image,
  Collapse,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { fetchProfilePicUrl } from "../utils/fetchProfilePic";
import ImageModal from "./ImageModal";
import useModeration from "../hooks/useModeration";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";

const Post = ({ post, onFlaggedContent }) => {
  const { currentUser } = useAuth();
  const isOwnPost =
    currentUser && post.userId && currentUser.uid === post.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [comments, setComments] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const { checkModeration } = useModeration();

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
    let unsubscribe;
    const fetchComments = () => {
      setCommentsLoading(true);
      setCommentsError("");
      const commentsRef = collection(firestore, "Posts", post.id, "Comments");
      const commentsQuery = query(commentsRef, orderBy("created_at", "asc"));
      unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const commentsData = [];
          snapshot.forEach((doc) =>
            commentsData.push({ id: doc.id, ...doc.data() })
          );
          setComments(commentsData);
          setCommentsLoading(false);
        },
        (error) => {
          console.error("Error fetching comments:", error);
          setCommentsError("Failed to load comments.");
          setCommentsLoading(false);
        }
      );
    };

    if (showComments) {
      fetchComments();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [showComments, post.id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (editedContent.trim() === "") {
      setError("Post content cannot be empty.");
      setLoading(false);
      return;
    }

    let isVisible = true;
    const postRef = doc(firestore, "Posts", post.id);

    try {
      await updateDoc(postRef, {
        content: editedContent,
        content_lower: editedContent.toLowerCase(),
        updated_at: serverTimestamp(),
        is_visible: isVisible,
      });
      setIsEditing(false);

      const isSafe = await checkModeration(
        editedContent,
        currentUser.accessToken,
        post.id,
        currentUser.uid
      );

      if (!isSafe) {
        isVisible = false;
        await updateDoc(postRef, { is_visible: isVisible });

        onFlaggedContent({ flaggedType: "selfHarm", content: editedContent });

        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            post_id: post.id,
            reason: "Trigger words detected",
            content: editedContent,
          },
          currentUser.accessToken
        );
      }
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || "An unexpected error occurred. Please try again."
      );
      console.error("Error updating post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setLoading(true);
    setError("");

    try {
      const postRef = doc(firestore, "Posts", post.id);
      await deleteDoc(postRef);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || "An unexpected error occurred. Please try again."
      );
      console.error("Error deleting post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setModalShow(true);
  };

  const toggleComments = () => setShowComments((prev) => !prev);

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
            <Button
              type="submit"
              variant="success"
              disabled={loading}
              className="mt-2"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
            <Button
              variant="secondary"
              className="mt-2 ms-2"
              onClick={() => setIsEditing(false)}
            >
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
                loading="lazy"
              />
              <Card.Subtitle className="text-muted">
                <strong>
                  {post.isAnonymous ? (
                    "Anonymous"
                  ) : (
                    <Link
                      to={`/users/${post.userId}`}
                      className="text-decoration-none"
                    >
                      {post.username}
                    </Link>
                  )}
                </strong>{" "}
                | <em>{post.created_at?.toDate().toLocaleString()}</em>
              </Card.Subtitle>
            </div>
            <Card.Text>{post.content}</Card.Text>
            {post.thumbnailUrl && (
              <div className="mb-3">
                <Image
                  src={post.thumbnailUrl}
                  alt="Post Thumbnail"
                  fluid
                  rounded
                  loading="lazy"
                  onClick={() => handleImageClick(post.imageUrl)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            )}
            <Card.Text className="text-muted">
              <strong>Mood:</strong> {post.mood}
            </Card.Text>
            <LikeButton
              postId={post.id}
              postOwnerId={post.userId}
              commentId={null}
              replyId={null}
            />
            <Button
              variant="link"
              onClick={toggleComments}
              aria-controls={`comments-${post.id}`}
              aria-expanded={showComments}
              className="mt-3 p-0"
            >
              {showComments ? "Hide Comments" : "Show Comments"}
            </Button>
            <Collapse in={showComments}>
              <div id={`comments-${post.id}`}>
                <hr />
                <h5>Comments</h5>
                {commentsError && (
                  <Alert variant="danger">{commentsError}</Alert>
                )}
                {commentsLoading ? (
                  <Spinner animation="border" />
                ) : (
                  <>
                    {comments.length === 0 ? (
                      <p>No comments yet.</p>
                    ) : (
                      comments.map((comment) => (
                        <Comment
                          key={comment.id}
                          comment={comment}
                          postId={post.id}
                        />
                      ))
                    )}
                    {currentUser && (
                      <CommentForm
                        postId={post.id}
                        postOwnerId={post.userId}
                      />
                    )}
                  </>
                )}
              </div>
            </Collapse>
            {isOwnPost && (
              <div className="mt-3">
                <Button
                  variant="warning"
                  onClick={() => setIsEditing(true)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </Card.Body>
      <ImageModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
        imageUrl={modalImageUrl}
        altText="Post Image"
      />
    </Card>
  );
};

export default Post;
