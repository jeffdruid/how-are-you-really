import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Form, Button, Spinner, Alert, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { fetchProfilePicUrl } from "../utils/fetchProfilePic";
import { firebaseErrorMessages } from "../utils/firebaseErrors"; // Import firebaseErrorMessages
import { useAuth } from "../contexts/AuthContext";
import LikeButton from "./LikeButton";
import useModeration from "../hooks/useModeration"; // Import moderation hook
import ResourceModal from "./ResourceModal"; // Import ResourceModal component
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";

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
      console.error("Error updating reply:", err);
      setError("Failed to update reply.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this reply?"
    );
    if (!confirmDelete) return;

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
      console.error("Error deleting reply:", err);
      setError("Failed to delete reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 mb-2">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Modal for sensitive content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />

      {isEditing ? (
        <Form onSubmit={handleEditReply}>
          <Form.Group controlId={`editReply-${reply.id}`}>
            <Form.Control
              as="textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
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
            {loading ? <Spinner animation="border" size="sm" /> : "Save"}
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
          <div className="d-flex align-items-center">
            <Link
              to={`/users/${reply.userId}`}
              className="text-decoration-none"
            >
              <Image
                src={profilePicUrl}
                roundedCircle
                width={20}
                height={20}
                className="me-2"
                loading="lazy"
              />
              <strong>{reply.username}</strong> |{" "}
            </Link>
            <em>{reply.created_at?.toDate().toLocaleString()}</em>
          </div>
          <p>{reply.content}</p>
          {/* Like Button for Reply */}
          <LikeButton
            postId={postId}
            commentId={commentId}
            replyId={reply.id}
          />
          {isOwnReply && (
            <>
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
                onClick={handleDeleteReply}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : "Delete"}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reply;
