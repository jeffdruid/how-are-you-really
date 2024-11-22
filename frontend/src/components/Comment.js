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
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import {
  Form,
  Button,
  Spinner,
  Alert,
  Image,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { fetchProfilePicUrl } from "../utils/fetchProfilePic";
import Reply from "./Reply";
import LikeButton from "./LikeButton";
import CommentForm from "./CommentForm";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";
import { BsThreeDotsVertical, BsReply, BsCheck, BsX } from "react-icons/bs";

const Comment = ({ comment, postId, onFlaggedContent }) => {
  const { currentUser } = useAuth();
  const isOwnComment = currentUser && comment.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [replies, setReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { checkModeration } = useModeration();
  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(
        comment.userId,
        comment.isAnonymous,
      );
      setProfilePicUrl(url);
    };
    if (comment.userId) {
      fetchProfilePic();
    }
  }, [comment.userId, comment.isAnonymous]);

  // Fetch replies for this comment, ordered by creation time
  useEffect(() => {
    const repliesRef = collection(
      firestore,
      "Posts",
      postId,
      "Comments",
      comment.id,
      "Replies",
    );
    const q = query(
      repliesRef,
      where("is_visible", "==", true), // Only fetch visible replies
      orderBy("created_at", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repliesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplies(repliesData);
    });
    return () => unsubscribe();
  }, [postId, comment.id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (editedContent.trim() === "") {
      setError("Comment cannot be empty.");
      setLoading(false);
      return;
    }

    let isVisible = true; // Initialize visibility as true
    const commentRef = doc(firestore, "Posts", postId, "Comments", comment.id);

    try {
      // Update the comment immediately
      await updateDoc(commentRef, {
        content: editedContent,
        content_lower: editedContent.toLowerCase(),
        updated_at: serverTimestamp(),
        is_visible: isVisible,
      });

      // Run moderation check on the edited content
      const isSafe = await checkModeration(
        editedContent,
        currentUser.accessToken,
      );

      if (!isSafe) {
        // Flag the content and set visibility to false
        isVisible = false;
        await updateDoc(commentRef, { is_visible: isVisible });

        setFlaggedType("selfHarm"); // Set flagged type for sensitive content
        setShowResources(true); // Display the ResourceModal
        onFlaggedContent({ flaggedType: "selfHarm", content: editedContent });

        // Send flagged content to DRF backend for moderation
        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            reason: "Trigger words detected",
            content: editedContent,
            parent_type: "comment",
            post_id: postId,
            comment_id: comment.id, // Include comment ID
          },
          currentUser.accessToken,
        );
      } else {
        // Close editing if content is safe
        setIsEditing(false);
      }
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    setLoading(true);
    setError("");

    try {
      await deleteDoc(doc(firestore, "Posts", postId, "Comments", comment.id));
    } catch (err) {
      setError(
        firebaseErrorMessages(err.code) || "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-white rounded shadow-sm border-start">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Modal for sensitive content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />

      {isEditing ? (
        <Form
          onSubmit={handleEdit}
          className="position-relative p-3 rounded"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
          }}
        >
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
                if (e.target.value.length <= 200) {
                  setEditedContent(e.target.value);
                }
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Edit your comment..."
              maxLength={200}
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

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small
              className="text-muted"
              style={{
                fontSize: "0.9rem",
                flexGrow: 1,
              }}
            >
              {200 - editedContent.length} characters remaining
            </small>

            <div className="d-flex">
              {/* Save Button */}
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>Save Comment</Tooltip>}
              >
                <Button
                  type="submit"
                  variant="outline-success"
                  className="d-flex align-items-center justify-content-center"
                  disabled={loading}
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
          <div className="d-flex justify-content-between align-items-start p-2 mb-2 flex-wrap">
            <div className="d-flex align-items-center flex-wrap">
              <Link
                to={`/users/${comment.userId}`}
                className="text-decoration-none text-dark"
              >
                {profilePicUrl && (
                  <Image
                    src={profilePicUrl}
                    loading="lazy"
                    roundedCircle
                    width={25}
                    height={25}
                    className="me-2 mb-2 mb-md-0"
                  />
                )}
                <strong className="text-dark">
                  {comment.isAnonymous ? "Anonymous" : comment.username}
                </strong>
              </Link>
              <span className="text-muted ms-2 small">
                | {comment.created_at?.toDate().toLocaleString()}
              </span>
            </div>

            {isOwnComment && (
              <Dropdown align="end" className="ms-auto">
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

          <p className="mb-2 text-wrap p-2">{comment.content}</p>

          <div className="d-flex justify-content-end">
            <LikeButton
              postId={postId}
              commentId={comment.id}
              likeCount={comment.likeCount}
            />
          </div>
          <hr />

          {replies.length > 0 && (
            <div className="ms-0 ">
              {replies.map((reply) => (
                <Reply
                  key={reply.id}
                  reply={reply}
                  postId={postId}
                  commentId={comment.id}
                  onFlaggedContent={onFlaggedContent}
                />
              ))}
            </div>
          )}

          <div className="ms-3 mt-2">
            <Button
              variant="link"
              onClick={() => setShowReplyForm((prev) => !prev)}
              className="p-0 text-muted d-flex align-items-center"
            >
              <BsReply size={20} className="me-1" />
              {showReplyForm ? "Cancel Reply" : "Add Reply"}
            </Button>

            {showReplyForm && (
              <div className="mt-3">
                <CommentForm
                  postId={postId}
                  commentId={comment.id}
                  parentType="reply"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Comment;
