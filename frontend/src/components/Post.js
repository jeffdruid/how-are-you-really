import React, { useState, useEffect } from "react";
import { firestore, storage } from "../firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { fetchProfilePicUrl } from "../utils/fetchProfilePic";
import ImageUploader from "./ImageUploader";
import ImageModal from "./ImageModal";
import useModeration from "../hooks/useModeration";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";
import { BsThreeDotsVertical, BsChat, BsCheck, BsX } from "react-icons/bs";
import { generateSearchableWords } from "../utils/textUtils";

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
  const [editedMood, setEditedMood] = useState(post.mood);
  const [editedAnonymous, setEditedAnonymous] = useState(post.isAnonymous);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [comments, setComments] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError] = useState("");
  const [images, setImages] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const { checkModeration } = useModeration();

  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(post.userId, post.isAnonymous);
      setProfilePicUrl(url);
    };
    if (post.userId) fetchProfilePic();
  }, [post.userId, post.isAnonymous]);

  useEffect(() => {
    let unsubscribe;
    if (showComments) {
      setCommentsLoading(true);
      const commentsRef = collection(firestore, "Posts", post.id, "Comments");
      const commentsQuery = query(
        commentsRef,
        where("is_visible", "==", true),
        orderBy("created_at", "asc"),
      );
      unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
        setCommentsLoading(false);
      });
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
    const contentWords = generateSearchableWords(editedContent); // Generate searchable words
    let isVisible = true;

    try {
      // Update post content, searchable words, and moderation status
      await updateDoc(postRef, {
        content: editedContent,
        content_lower: editedContent.toLowerCase(),
        content_words: contentWords, // Save words as an array
        mood: editedMood,
        isAnonymous: editedAnonymous,
        updated_at: serverTimestamp(),
        is_visible: isVisible,
      });

      console.log("Post updated successfully.", contentWords);

      // Image upload (if edited)
      if (images) {
        setUploading(true);
        const originalRef = ref(
          storage,
          `post_images/${post.id}/original_${images.original.name}`,
        );
        await uploadBytes(originalRef, images.original);
        const originalURL = await getDownloadURL(originalRef);

        const thumbnailRef = ref(
          storage,
          `post_images/${post.id}/thumbnail_${images.thumbnail.name}`,
        );
        await uploadBytes(thumbnailRef, images.thumbnail);
        const thumbnailURL = await getDownloadURL(thumbnailRef);

        await updateDoc(postRef, {
          imageUrl: originalURL,
          thumbnailUrl: thumbnailURL,
          updated_at: serverTimestamp(),
        });
        setUploading(false);
      }

      // Perform moderation check on the edited content
      const isSafe = await checkModeration(
        editedContent,
        currentUser.accessToken,
      );

      if (!isSafe) {
        // Set visibility to false and send flagged content to DRF if flagged
        isVisible = false;
        await updateDoc(postRef, { is_visible: isVisible });

        onFlaggedContent({ flaggedType: "selfHarm", content: editedContent });

        // Send flagged post data to DRF for moderation handling
        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            reason: "Trigger words detected",
            content: editedContent,
            parent_type: "post",
            post_id: post.id, // Send post ID to DRF
          },
          currentUser.accessToken,
        );
      }

      // Close editing mode if content passes moderation
      setIsEditing(false);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || "An unexpected error occurred.");
      console.error("Error updating post:", err);
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
        firebaseErrorMessages(err.code) || "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setModalShow(true); // Open the modal when the image is clicked
  };

  const toggleComments = () => setShowComments((prev) => !prev);

  return (
    <Card
      className="mb-4 shadow-sm border-0 p-1 pt-2"
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
          <Form onSubmit={handleEdit} className="d-flex flex-column gap-2">
            {/* Content Textarea */}
            <Form.Group controlId="editContent" className="mb-3">
              <div
                className="position-relative"
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #ced4da",
                  borderRadius: "8px",
                  paddingRight: "50px", // Space for save/cancel buttons
                  paddingLeft: "10px",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                }}
              >
                <Form.Control
                  as="textarea"
                  value={editedContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setEditedContent(e.target.value);
                    }
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Edit your post..."
                  maxLength={300}
                  rows={1}
                  className="border-0"
                  style={{
                    resize: "none",
                    overflow: "hidden",
                    fontSize: "1rem",
                    lineHeight: "1.5",
                    outline: "none",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              <div className="text-muted text-end mt-1">
                {300 - editedContent.length} characters remaining
              </div>
            </Form.Group>

            {/* Mood Selection */}
            <Form.Group controlId="editMood" className="mb-3">
              <Form.Select
                value={editedMood}
                onChange={(e) => setEditedMood(e.target.value)}
                style={{
                  fontSize: "1rem",
                  border: "1px solid #ced4da",
                  borderRadius: "10px",
                }}
              >
                <option value="happy">😊 Happy</option>
                <option value="sad">😢 Sad</option>
                <option value="anxious">😟 Anxious</option>
                <option value="excited">🤩 Excited</option>
                <option value="angry">😠 Angry</option>
                <option value="stressed">😰 Stressed</option>
                <option value="calm">😌 Calm</option>
                <option value="grateful">🙏 Grateful</option>
              </Form.Select>
            </Form.Group>

            {/* Anonymous Toggle */}
            <Form.Group
              controlId="editAnonymous"
              className="d-flex align-items-center gap-2 mb-3"
            >
              <Form.Check
                type="checkbox"
                label="Post Anonymously"
                checked={editedAnonymous}
                onChange={(e) => setEditedAnonymous(e.target.checked)}
              />
            </Form.Group>

            {/* Image Uploader */}
            <ImageUploader
              onImageSelected={setImages}
              maxSize={5 * 1024 * 1024}
              accept="image/*"
            />

            {/* Action Buttons */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted" style={{ fontSize: "0.9rem" }}>
                Adjust your post as needed.
              </small>
              <div className="d-flex">
                {/* Save Button */}
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Save Post</Tooltip>}
                >
                  <Button
                    type="submit"
                    variant="outline-success"
                    className="d-flex align-items-center justify-content-center"
                    disabled={loading || uploading}
                    style={{
                      borderRadius: "50%",
                      padding: "6px",
                      width: "30px",
                      height: "30px",
                      marginRight: "10px",
                    }}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <BsCheck size={20} />
                    )}
                  </Button>
                </OverlayTrigger>

                {/* Cancel Button */}
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Cancel</Tooltip>}
                >
                  <Button
                    type="button"
                    variant="outline-danger"
                    onClick={() => setIsEditing(false)}
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      borderRadius: "50%",
                      padding: "6px",
                      width: "30px",
                      height: "30px",
                    }}
                  >
                    <BsX size={20} />
                  </Button>
                </OverlayTrigger>
              </div>
            </div>
          </Form>
        ) : (
          <>
            {/* Post Content */}
            <Card.Text>{post.content}</Card.Text>

            {/* Mood Section */}
            <Card.Text className="text-muted text-center mb-3">
              <strong>Mood:</strong> <span>{moodEmojis[post.mood]}</span>
              {/* {post.mood} */}
            </Card.Text>

            {post.thumbnailUrl && (
              <div className="text-center mb-3">
                <Image
                  src={post.thumbnailUrl}
                  alt="Post Thumbnail"
                  fluid
                  rounded
                  loading="lazy"
                  onClick={() => handleImageClick(post.imageUrl)} // Use the handler function
                  style={{ cursor: "pointer", maxHeight: "250px" }}
                />
              </div>
            )}

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
