import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal"; // Import the ResourceModal component

const CommentForm = ({ postId, commentId, postOwnerId, parentType = "comment" }) => {
  const { currentUser, username } = useAuth();
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { checkModeration } = useModeration();

  // State to manage the modal visibility
  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null); // To store the type of sensitive content

  useEffect(() => {
    // console.log("Post/Comment Owner ID:", postOwnerId);
  }, [postOwnerId]);

  const handleAddContent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (content.trim() === "") {
      setError(`${parentType === "comment" ? "Comment" : "Reply"} cannot be empty.`);
      setLoading(false);
      return;
    }

    // Use moderation to check for trigger words
    const isSafe = await checkModeration(content, currentUser.accessToken);
    if (!isSafe) {
      setFlaggedType("suicide"); // Customize based on the type of trigger words
      setShowResources(true); // Show the modal for sensitive content
      try {
        await addDoc(collection(firestore, "ModerationQueue"), {
          userId: currentUser.uid,
          username: isAnonymous ? "Anonymous" : username,
          content,
          isAnonymous,
          created_at: serverTimestamp(),
          status: "pending",
          parentType,
          postId,
          commentId: parentType === "reply" ? commentId : null,
        });
        console.log(`${parentType.charAt(0).toUpperCase() + parentType.slice(1)} flagged and saved for moderation`);
      } catch (err) {
        console.error(`Error saving ${parentType} to moderation queue:`, err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // Add the comment or reply to Firestore
      const collectionPath = parentType === "comment" 
        ? `Posts/${postId}/Comments` 
        : `Posts/${postId}/Comments/${commentId}/Replies`;

      const contentRef = await addDoc(
        collection(firestore, collectionPath),
        {
          userId: currentUser.uid,
          username: isAnonymous ? "Anonymous" : username,
          content,
          isAnonymous,
          likeCount: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        }
      );

      console.log(`${parentType.charAt(0).toUpperCase() + parentType.slice(1)} added successfully:`, contentRef.id);

      // Notify the post owner (if applicable)
      if (parentType === "comment" && postOwnerId) {
        if (currentUser.uid !== postOwnerId) {
          console.log("Sending notification to post owner:", postOwnerId);
          const notificationsRef = collection(firestore, "Users", postOwnerId, "Notifications");
          await addDoc(notificationsRef, {
            type: parentType,
            fromUserId: currentUser.uid,
            postId,
            commentId: contentRef.id,
            created_at: serverTimestamp(),
            read: false,
          });
          console.log("Notification sent to post owner:", postOwnerId);
        } else {
          console.log("The commenter is the post owner. No notification sent.");
        }
      }

      // Reset form
      setContent("");
      setIsAnonymous(false);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || `An unexpected error occurred. Please try again.`);
      console.error(`Error adding ${parentType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Modal for flagged content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />

      <Form onSubmit={handleAddContent}>
        <Form.Group controlId="content">
          <Form.Control
            as="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Add a ${parentType}...`}
            rows={2}
            required
          />
        </Form.Group>
        <Form.Group className="mt-2">
          <Form.Check
            type="checkbox"
            label="Post Anonymously"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
        </Form.Group>
        <Button
          type="submit"
          variant="success"
          className="mt-3"
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : `Post ${parentType.charAt(0).toUpperCase() + parentType.slice(1)}`}
        </Button>
      </Form>
    </div>
  );
};

export default CommentForm;
