import React, { useState } from "react";
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

  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

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
        className={`position-relative ${
          parentType === "reply" ? "ps-2 " : ""
        }`}
      >
        <Form.Control
          as="textarea"
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Add a ${parentType}...`}
          className={`pr-5 ${
            parentType === "reply" ? "border" : "border"
          }`}
          style={{
            borderColor: parentType === "reply" ? "#cccccc" : "inherit",
          }}
        />

        {/* Anonymous Toggle Icon with Tooltip */}
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
            className="position-absolute top-50 end-0 translate-middle-y me-2"
            style={{ cursor: "pointer", color: isAnonymous ? "blue" : "gray" }}
          >
            <BsFillPersonFill size={20} />
          </span>
        </OverlayTrigger>

        <div className="d-flex justify-content-end mt-2">
          {/* Save Button */}
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>Save {parentType}</Tooltip>}
          >
            <Button
              type="button"
              variant="link"
              onClick={handleAddContent}
              className="text-success"
              disabled={loading}
              style={{ padding: "0 0.5rem" }}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <BsCheck size={20} />
              )}
            </Button>
          </OverlayTrigger>

          {/* Cancel Button */}
          <OverlayTrigger placement="bottom" overlay={<Tooltip>Cancel</Tooltip>}>
            <Button
              type="button"
              variant="link"
              onClick={handleCancel}
              className="text-danger"
              style={{ padding: "0 0.5rem" }}
            >
              <BsX size={20} />
            </Button>
          </OverlayTrigger>
        </div>
      </Form>
    </div>
  );
};

export default CommentForm;
