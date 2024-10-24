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
import { useAuth } from "../contexts/AuthContext";
import LikeButton from "./LikeButton";
import useModeration from "../hooks/useModeration"; // Import moderation hook
import ResourceModal from "./ResourceModal"; // Import ResourceModal component

const Reply = ({ reply, postId, commentId }) => {
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

    // Use moderation to check for trigger words
    const isSafe = await checkModeration(
      editedContent,
      currentUser.accessToken
    );
    if (!isSafe) {
      setFlaggedType("self-harm"); // Update this based on the type of trigger word
      setShowResources(true); // Show modal for sensitive content
      try {
        await updateDoc(doc(firestore, "ModerationQueue", reply.id), {
          userId: currentUser.uid,
          username: reply.username || "Anonymous",
          content: editedContent,
          isAnonymous: false,
          created_at: reply.created_at,
          updated_at: serverTimestamp(),
          status: "pending",
        });
      } catch (err) {
        console.error("Error adding reply to moderation queue:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

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
      await updateDoc(replyRef, {
        content: editedContent,
        updated_at: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (err) {
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
