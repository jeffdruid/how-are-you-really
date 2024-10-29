import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";

const CommentForm = ({
  postId,
  commentId,
  postOwnerId,
  parentType = "comment",
}) => {
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

    // Initial visibility setting
    let isVisible = true;
    let contentRef;

    try {
        // Path for Firestore collection based on `parentType`
        const collectionPath = parentType === "comment" 
            ? `Posts/${postId}/Comments` 
            : `Posts/${postId}/Comments/${commentId}/Replies`;

        // Add the comment or reply with initial visibility set to true
        contentRef = await addDoc(
            collection(firestore, collectionPath),
            {
                userId: currentUser.uid,
                username: isAnonymous ? "Anonymous" : username,
                content,
                content_lower: content.toLowerCase(), // for case-insensitive search
                isAnonymous,
                likeCount: 0,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                is_visible: isVisible,
            }
        );

        console.log(`${parentType.charAt(0).toUpperCase() + parentType.slice(1)} added successfully:`, contentRef.id);

        // Run moderation check
        const isSafe = await checkModeration(content, currentUser.accessToken);
        if (!isSafe) {
            isVisible = false;

            // Update visibility in Firestore and show resource modal
            await updateDoc(contentRef, { is_visible: isVisible });
            setFlaggedType("selfHarm"); // or other trigger type
            setShowResources(true);

            // Send flagged content to DRF backend
            await sendFlaggedContentToDRF(
                {
                    user: currentUser.uid,
                    post_id: postId,
                    reason: "Trigger words detected",
                    content,
                    parent_type: parentType,
                    comment_id: parentType === "reply" ? commentId : null,
                },
                currentUser.accessToken
            );

            // Skip displaying flagged content by returning early
            setContent("");
            setIsAnonymous(false);
            return;
        }

        // Send notification to the post owner if content is safe
        if (parentType === "comment" && postOwnerId && currentUser.uid !== postOwnerId) {
            const notificationsRef = collection(firestore, "Users", postOwnerId, "Notifications");
            await addDoc(notificationsRef, {
                type: parentType,
                fromUserId: currentUser.uid,
                postId,
                commentId: contentRef.id,
                created_at: serverTimestamp(),
                read: false,
            });
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
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            `Post ${parentType.charAt(0).toUpperCase() + parentType.slice(1)}`
          )}
        </Button>
      </Form>
    </div>
  );
};

export default CommentForm;
