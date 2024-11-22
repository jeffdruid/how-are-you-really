import React, { useState, useRef } from "react";
import { firestore } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import {
  Form,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Button,
} from "react-bootstrap";
import { BsFillPersonFill, BsCheck, BsX } from "react-icons/bs";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";

const CommentForm = ({
  postId,
  commentId,
  postOwnerId,
  parentType = "comment",
  replyId = null, // Define replyId with a default of null
}) => {
  const { currentUser, username } = useAuth();
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { checkModeration } = useModeration();
  const textareaRef = useRef(null);

  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

  const maxChars = 200; // Set the maximum character limit

  const handleAddContent = async () => {
    if (!content.trim()) {
      setError(
        `${parentType === "comment" ? "Comment" : "Reply"} cannot be empty.`,
      );
      return;
    }

    setLoading(true);
    setError("");

    let isVisible = true;

    try {
      const collectionPath =
        parentType === "comment"
          ? `Posts/${postId}/Comments`
          : `Posts/${postId}/Comments/${commentId}/Replies`;

      // Add the comment or reply to Firestore and retrieve the ID
      const contentRef = await addDoc(collection(firestore, collectionPath), {
        userId: currentUser.uid,
        username: isAnonymous ? "Anonymous" : username,
        content,
        content_lower: content.toLowerCase(),
        isAnonymous,
        likeCount: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_visible: isVisible,
      });

      const isSafe = await checkModeration(content, currentUser.accessToken);
      if (!isSafe) {
        isVisible = false;
        await updateDoc(contentRef, { is_visible: isVisible });
        setFlaggedType("selfHarm");
        setShowResources(true);

        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            reason: "Trigger words detected",
            content,
            parent_type: parentType,
            ...(parentType === "post" && { post_id: postId }),
            ...(parentType === "comment" && {
              post_id: postId,
              comment_id: contentRef.id, // Pass Firestore-generated comment ID
            }),
            ...(parentType === "reply" && {
              post_id: postId,
              comment_id: commentId,
              reply_id: contentRef.id, // Pass Firestore-generated reply ID
            }),
          },
          currentUser.accessToken,
        );

        setContent("");
        setIsAnonymous(false);
        return;
      }

      setContent("");
      setIsAnonymous(false);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || `An unexpected error occurred. Please try again.`,
      );
      console.error(`Error adding ${parentType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(""); // Clear the input
    setError(""); // Clear any existing error
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
    }
  };

  const handleInput = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Adjust height to fit content
    }
  };

  return (
    <div className="mt-3">
      {error && <div className="text-danger mb-2">{error}</div>}

      {/* Resource Modal for Flagged Content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />

      <Form
        onSubmit={(e) => e.preventDefault()}
        className="position-relative p-3 rounded"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
        }}
      >
        {/* Input Container */}
        <div
          className="position-relative"
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #ced4da",
            borderRadius: "8px",
            paddingRight: "50px", // Space for anonymous button
            paddingLeft: "10px", // Space for text
            paddingTop: "5px",
            paddingBottom: "5px",
          }}
        >
          {/* Anonymous Toggle Icon */}
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {isAnonymous ? "Posting as Anonymous" : "Post Anonymously"}
              </Tooltip>
            }
          >
            <span
              onClick={() => setIsAnonymous(!isAnonymous)}
              className="position-absolute end-0 me-3"
              style={{
                cursor: "pointer",
                color: isAnonymous ? "#0d6efd" : "#6c757d",
                fontSize: "1.4rem",
              }}
            >
              <BsFillPersonFill />
            </span>
          </OverlayTrigger>

          {/* Text Area with Expanding Behavior */}
          <Form.Control
            as="textarea"
            rows={1}
            value={content}
            ref={textareaRef}
            onInput={handleInput}
            maxLength={maxChars}
            placeholder={`Add a ${parentType}...`}
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

        {/* Character Count and Buttons */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small
            className="text-muted"
            style={{
              fontSize: "0.9rem",
              flexGrow: 1,
            }}
          >
            {maxChars - content.length} characters remaining
          </small>

          <div className="d-flex">
            {/* Save Button */}
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip>Save {parentType}</Tooltip>}
            >
              <Button
                type="button"
                variant="outline-success"
                onClick={handleAddContent}
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
                onClick={handleCancel}
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
    </div>
  );
};

export default CommentForm;
