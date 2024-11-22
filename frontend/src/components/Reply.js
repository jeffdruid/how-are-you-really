import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
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
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import { useAuth } from "../contexts/AuthContext";
import LikeButton from "./LikeButton";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";
import { BsThreeDotsVertical, BsCheck, BsX } from "react-icons/bs";

const Reply = ({ reply, postId, commentId, onFlaggedContent }) => {
  const { currentUser } = useAuth();
  const isOwnReply = currentUser && reply.userId === currentUser.uid;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState("");

  const { checkModeration } = useModeration();
  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

  // Fetch the user's profile picture URL using the utility function
  useEffect(() => {
    const fetchProfilePic = async () => {
      const url = await fetchProfilePicUrl(reply.userId, reply.isAnonymous);
      setProfilePicUrl(url);
    };

    if (reply.userId || reply.isAnonymous) {
      fetchProfilePic();
    }
  }, [reply.userId, reply.isAnonymous]);

  // Handle editing a reply
  const handleEditReply = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (editedContent.trim() === "") {
      setError("Reply content cannot be empty.");
      setLoading(false);
      return;
    }

    let isVisible = true; // Initially set visibility to true
    const replyRef = doc(
      firestore,
      "Posts",
      postId,
      "Comments",
      commentId,
      "Replies",
      reply.id,
    );

    try {
      // Update the reply content immediately
      await updateDoc(replyRef, {
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
        // Flag content if moderation fails and set `is_visible` to false
        isVisible = false;
        await updateDoc(replyRef, { is_visible: isVisible });

        setFlaggedType("selfHarm");
        setShowResources(true);
        onFlaggedContent({ flaggedType: "selfHarm", content: editedContent });

        // Send flagged content to DRF for further moderation
        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            reason: "Trigger words detected",
            content: editedContent,
            parent_type: "reply",
            post_id: postId,
            comment_id: commentId,
            reply_id: reply.id,
          },
          currentUser.accessToken,
        );
      } else {
        // If content is safe, close editing mode
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

  // Handle deleting a reply
  const handleDeleteReply = async () => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    setLoading(true);
    const replyRef = doc(
      firestore,
      "Posts",
      postId,
      "Comments",
      commentId,
      "Replies",
      reply.id,
    );

    try {
      await deleteDoc(replyRef);
      console.log("Reply deleted:", reply.id);
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
          onSubmit={handleEditReply}
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
              placeholder="Edit your reply..."
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
                overlay={<Tooltip>Save Reply</Tooltip>}
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
                to={`/users/${reply.userId}`}
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
                <strong className="text-dark">{reply.username}</strong>
              </Link>
              <span className="text-muted ms-2 small">
                | {reply.created_at?.toDate().toLocaleString()}
              </span>
            </div>

            {/* Three-dot dropdown menu for edit/delete */}
            {isOwnReply && (
              <Dropdown align="end" className="ms-auto">
                <Dropdown.Toggle variant="link" className="text-muted p-0">
                  <BsThreeDotsVertical size={18} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setIsEditing(true)}>
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleDeleteReply}>
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>

          <p className="mb-2 p-2 text-wrap">{reply.content}</p>

          {/* Like Button for Reply */}
          <div className="d-flex justify-content-end">
            <LikeButton
              postId={postId}
              commentId={commentId}
              replyId={reply.id}
              likeCount={reply.likeCount}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reply;
