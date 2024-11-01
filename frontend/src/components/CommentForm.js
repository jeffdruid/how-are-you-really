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
import { Form, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import { BsFillPersonFill } from "react-icons/bs";
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

  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

  const handleAddContent = async () => {
    if (!content.trim()) {
      setError(
        `${parentType === "comment" ? "Comment" : "Reply"} cannot be empty.`
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
            post_id: postId,
            reason: "Trigger words detected",
            content,
            parent_type: parentType,
            comment_id: parentType === "reply" ? commentId : null,
          },
          currentUser.accessToken
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
        friendlyMessage || `An unexpected error occurred. Please try again.`
      );
      console.error(`Error adding ${parentType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddContent();
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
          onKeyPress={handleKeyPress}
          className={`pr-5 ${
            parentType === "reply" ? "border-light" : "border-light"
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

        {loading && (
          <div className="text-center mt-2">
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </Form>
    </div>
  );
};

export default CommentForm;
