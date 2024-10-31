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
  where,
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
  Dropdown,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { fetchProfilePicUrl } from "../utils/fetchProfilePic";
import ImageModal from "./ImageModal";
import useModeration from "../hooks/useModeration";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";
import { BsThreeDotsVertical, BsChat } from "react-icons/bs";

// Mood emojis
const moodEmojis = {
  happy: "😊",
  sad: "😢",
  anxious: "😟",
  excited: "🤩",
  angry: "😠",
  stressed: "😰",
  calm: "😌",
  grateful: "🙏",
};

const Post = ({ post, onFlaggedContent }) => {
  const { currentUser } = useAuth();
  const isOwnPost = currentUser && post.userId === currentUser.uid;

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
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false); // Track if user has liked this post
  const { checkModeration } = useModeration();

  // Fetch the profile picture URL based on user and anonymity settings
  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(post.userId, post.isAnonymous);
      setProfilePicUrl(url);
    };
    if (post.userId) {
      fetchProfilePic();
    }
  }, [post.userId, post.isAnonymous]);

  // Fetch comments when "Show Comments" is toggled
  useEffect(() => {
    let unsubscribe;
    if (showComments) {
      setCommentsLoading(true);
      const commentsRef = collection(firestore, "Posts", post.id, "Comments");
      const commentsQuery = query(
        commentsRef,
        where("is_visible", "==", true),
        orderBy("created_at", "asc")
      );
      unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(commentsData);
          setCommentsLoading(false);
        },
        (error) => {
          setCommentsError("Failed to load comments.");
          setCommentsLoading(false);
        }
      );
    }
    return () => unsubscribe && unsubscribe();
  }, [showComments, post.id]);

  // Handle editing a post
  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (editedContent.trim() === "") {
      setError("Post content cannot be empty.");
      setLoading(false);
      return;
    }

    const postRef = doc(firestore, "Posts", post.id);
    let isVisible = true;

    try {
      // Update post content and moderation status
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
      setError(
        firebaseErrorMessages(err.code) || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a post
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setLoading(true);

    try {
      await deleteDoc(doc(firestore, "Posts", post.id));
    } catch (err) {
      setError(
        firebaseErrorMessages(err.code) || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show image in modal
  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setModalShow(true);
  };

  // Toggle visibility of comments
  const toggleComments = () => setShowComments((prev) => !prev);

  return (
    <Card
      className="mb-4 shadow-sm border-0 p-3"
      style={{ borderRadius: "10px", backgroundColor: "#f9f9f9" }}
    >
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* Profile Section */}
          <div className="d-flex align-items-center">
            <Image
              src={profilePicUrl}
              roundedCircle
              width={40}
              height={40}
              className="me-2"
              loading="lazy"
            />
            <div>
              <strong>
                {post.isAnonymous ? (
                  "Anonymous"
                ) : (
                  <Link
                    to={`/users/${post.userId}`}
                    className="text-decoration-none text-dark"
                  >
                    {post.username}
                  </Link>
                )}
              </strong>
              <br />
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                {post.created_at?.toDate().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Three-Dot Menu for Edit/Delete */}
          {isOwnPost && (
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-muted p-0">
                <BsThreeDotsVertical size={20} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setIsEditing(true)}>
                  Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={handleDelete}>Delete</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {isEditing ? (
          // Post Editing Form
          <Form onSubmit={handleEdit}>
            <Form.Group controlId="editContent">
              <Form.Control
                as="textarea"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows="3"
                required
                className="mb-2"
              />
            </Form.Group>
            <Button
              type="submit"
              variant="success"
              disabled={loading}
              className="me-2"
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Form>
        ) : (
          <>
            {/* Centered Image Thumbnail */}
            {post.thumbnailUrl && (
              <div className="text-center mb-3">
                <Image
                  src={post.thumbnailUrl}
                  alt="Post Thumbnail"
                  fluid
                  rounded
                  loading="lazy"
                  onClick={() => handleImageClick(post.imageUrl)}
                  style={{ cursor: "pointer", maxHeight: "250px" }}
                />
              </div>
            )}
            {/* Post Content */}
            <Card.Text>{post.content}</Card.Text>

            {/* Mood Section */}
            <Card.Text className="text-muted text-center mb-3">
              <strong>Mood:</strong> <span>{moodEmojis[post.mood]}</span>
              {/* {post.mood} */}
            </Card.Text>

            {/* Like Button and Comments */}
            <div className="d-flex justify-content-between mt-2 align-items-center">
              <Button
                variant="link"
                onClick={toggleComments}
                aria-controls={`comments-${post.id}`}
                aria-expanded={showComments}
                className="p-0 text-muted d-flex align-items-center"
              >
                <BsChat size={20} className="me-1" />
                {showComments ? "Hide" : "Show"} Comments
              </Button>
              {/* TODO - fix like button design */}
              <LikeButton
                postId={post.id}
                postOwnerId={post.userId}
                isLiked={isLiked}
                setIsLiked={setIsLiked}
                likeCount={likeCount}
                setLikeCount={setLikeCount}
              />
            </div>

            {/* Comments Section */}
            <Collapse in={showComments}>
              <div>
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
                          onFlaggedContent={onFlaggedContent}
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
          </>
        )}
      </Card.Body>

      {/* Image Modal */}
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
