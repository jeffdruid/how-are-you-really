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

  const { checkModeration } = useModeration(); // Use moderation hook
  const [showResources, setShowResources] = useState(false); // State for modal visibility
  const [flaggedType, setFlaggedType] = useState(null); // Store flagged content type

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
      reply.id
    );

    try {
      // Update the reply content immediately
      await updateDoc(replyRef, {
        content: editedContent,
        content_lower: editedContent.toLowerCase(),
        updated_at: serverTimestamp(),
        is_visible: isVisible,
      });

      // Run moderation check on the updated reply content
      const isSafe = await checkModeration(
        editedContent,
        currentUser.accessToken
      );
      if (!isSafe) {
        // Flag content if moderation fails and set `is_visible` to false
        isVisible = false;
        await updateDoc(replyRef, { is_visible: isVisible });

        setFlaggedType("self-harm"); // or any other relevant type based on moderation
        setShowResources(true); // Display the resource modal for flagged content
        onFlaggedContent({ flaggedType: "selfHarm", content: editedContent });

        // Send flagged content to DRF for further moderation
        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            post_id: postId,
            comment_id: commentId,
            reply_id: reply.id,
            reason: "Trigger words detected",
            content: editedContent,
          },
          currentUser.accessToken
        );
      } else {
        setIsEditing(false); // Close editing mode if content is safe
      }
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || "An unexpected error occurred. Please try again."
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
      reply.id
    );

    try {
      await deleteDoc(replyRef);
      console.log("Reply deleted:", reply.id);
    } catch (err) {
      setError(
        firebaseErrorMessages(err.code) || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-3 p-3 bg-white rounded shadow-sm"
      style={{ borderLeft: "1px solid #ddd" }}
    >
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Modal for sensitive content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />

      {isEditing ? (
        <Form onSubmit={handleEditReply} className="d-flex align-items-center">
          <Form.Group
            controlId={`editReply-${reply.id}`}
            className="flex-grow-1 me-2"
          >
            <Form.Control
              as="textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={1}
              required
              style={{
                fontSize: "0.9rem",
                borderRadius: "5px",
                padding: "8px",
                border: "1px solid #ddd",
              }}
            />
          </Form.Group>
          <Button
            type="submit"
            variant="link"
            className="text-success"
            disabled={loading}
            style={{ padding: "0 0.5rem" }}
            title="Save"
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <BsCheck size={20} />
            )}
          </Button>
          <Button
            variant="link"
            onClick={() => setIsEditing(false)}
            className="text-danger"
            style={{ padding: "0 0.5rem" }}
            title="Cancel"
          >
            <BsX size={20} />
          </Button>
        </Form>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center">
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
                    className="me-2"
                  />
                )}
                <strong style={{ color: "black" }}>{reply.username}</strong>
              </Link>
              <span
                className="text-muted"
                style={{ fontSize: "0.85rem", marginLeft: "0.5rem" }}
              >
                | {reply.created_at?.toDate().toLocaleString()}
              </span>
            </div>

            {/* Three-dot dropdown menu for edit/delete */}
            {isOwnReply && (
              <Dropdown align="end">
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

          <p className="mb-2">{reply.content}</p>

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
