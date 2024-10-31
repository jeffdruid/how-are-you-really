import React, { useState, useEffect } from "react";
import { firestore, storage } from "../firebase";
import {
  collection,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import {
  Form,
  Button,
  Alert,
  Spinner,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import ImageUploader from "./ImageUploader";
import useModeration from "../hooks/useModeration";
import ResourceModal from "./ResourceModal";
import { sendFlaggedContentToDRF } from "../utils/sendFlaggedContent";
import { FaRegPlusSquare } from "react-icons/fa"; // Import square plus icon

const CreatePost = ({ onFlaggedContent }) => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("happy");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  // Image upload states
  const [images, setImages] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { checkModeration } = useModeration();

  // Modal state for flagged content
  const [showResources, setShowResources] = useState(false);
  const [flaggedType, setFlaggedType] = useState(null);

  // Fetch username from Firestore
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userDocRef = doc(firestore, "Users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || "Anonymous");
        } else {
          setUsername("Anonymous");
        }
      } catch (err) {
        console.error("Error fetching username:", err);
        setUsername("Anonymous");
      }
    };
    if (currentUser) {
      fetchUsername();
    }
  }, [currentUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (content.trim() === "") {
      setError("Post content cannot be empty.");
      setLoading(false);
      return;
    }

    let isVisible = true;
    const newPostRef = doc(collection(firestore, "Posts")); // Generate a new post reference

    try {
      // Set initial post data
      await setDoc(newPostRef, {
        userId: currentUser.uid,
        username: isAnonymous ? "Anonymous" : username,
        content,
        content_lower: content.toLowerCase(),
        mood,
        isAnonymous,
        likeCount: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        imageUrl: null,
        thumbnailUrl: null,
        is_visible: isVisible, // Initially set to visible
      });

      const postId = newPostRef.id; // Retrieve post ID after document creation

      // Image upload (if any)
      if (images) {
        setUploading(true);

        // Upload original image
        const originalRef = ref(
          storage,
          `post_images/${postId}/original_${images.original.name}`
        );
        await uploadBytes(originalRef, images.original);
        const originalURL = await getDownloadURL(originalRef);

        // Upload thumbnail image
        const thumbnailRef = ref(
          storage,
          `post_images/${postId}/thumbnail_${images.thumbnail.name}`
        );
        await uploadBytes(thumbnailRef, images.thumbnail);
        const thumbnailURL = await getDownloadURL(thumbnailRef);

        // Update post document with image URLs
        await updateDoc(newPostRef, {
          imageUrl: originalURL,
          thumbnailUrl: thumbnailURL,
          updated_at: serverTimestamp(),
        });

        setUploading(false);
      }

      // Moderation check
      const isSafe = await checkModeration(content, currentUser.accessToken);
      if (!isSafe) {
        // If flagged, update Firestore visibility and show resources modal
        isVisible = false;
        await updateDoc(newPostRef, { is_visible: isVisible });

        setFlaggedType("selfHarm");
        setShowResources(true);

        // Send flagged content to DRF backend
        await sendFlaggedContentToDRF(
          {
            user: currentUser.uid,
            post_id: postId,
            reason: "Trigger words detected",
            content,
          },
          currentUser.accessToken
        );
      }

      // Reset form fields
      setContent("");
      setMood("happy");
      setIsAnonymous(false);
      setImages(null);
      setShowModal(false);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(
        friendlyMessage || "An unexpected error occurred. Please try again."
      );
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Supportive Message */}
      <div className="text-center mb-3">
        <p style={{ fontStyle: "italic", color: "#6c757d" }}>
          Share how you're feeling today. Your thoughts matter.
        </p>
      </div>

      {/* Plus Icon and Label Button to Show Modal */}
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>Create a New Post</Tooltip>}
      >
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          className="mb-3 d-flex align-items-center"
          style={{
            width: "auto",
            backgroundColor: "#0000001f",
            color: "black",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: "auto",
          }}
        >
          <FaRegPlusSquare size={24} />
          <span>Create Post</span>
        </Button>
      </OverlayTrigger>

      {/* Modal for Creating Post */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create a New Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreatePost}>
            <Form.Group className="mb-3" controlId="postContent">
              <Form.Control
                as="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                required
              />
            </Form.Group>

            {/* Image Upload Component */}
            <Form.Group className="mb-3">
              <ImageUploader
                onImageSelected={(files) => setImages(files)}
                maxSize={5 * 1024 * 1024}
                accept="image/*"
              />
              {uploading && (
                <Spinner animation="border" size="sm" className="mt-2" />
              )}
            </Form.Group>

            {/* Mood Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Mood</Form.Label>
              <Form.Select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option value="happy">😊 Happy</option>
                <option value="sad">😢 Sad</option>
                <option value="anxious">😟 Anxious</option>
                <option value="excited">🤩 Excited</option>
                <option value="angry">😠 Angry</option>
                <option value="stressed">😰 Stressed</option>
                <option value="calm">😌 Calm</option>
                <option value="grateful">🙏 Grateful</option>
              </Form.Select>
            </Form.Group>

            {/* Anonymity Checkbox */}
            <Form.Group className="mb-3" controlId="postAnonymously">
              <Form.Check
                type="checkbox"
                label="Post Anonymously"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            </Form.Group>

            {/* Error Display */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || uploading}
            >
              {loading ? "Posting..." : "Post"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Resource Modal for Flagged Content */}
      <ResourceModal
        show={showResources}
        handleClose={() => setShowResources(false)}
        flaggedType={flaggedType}
      />
    </>
  );
};

export default CreatePost;
