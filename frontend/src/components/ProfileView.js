import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { firestore, storage } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import DeleteAccount from "./DeleteAccount";
import FollowButton from "./FollowButton";
import FollowStats from "./FollowStats";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Image,
  Alert,
  ProgressBar,
  Spinner,
  Card,
} from "react-bootstrap";
import UserStats from "./UserStats";
import UserPosts from "./UserPosts";
import ImageUploader from "./ImageUploader";
import ImageModal from "./ImageModal";
import { FaUserFriends, FaChartLine } from "react-icons/fa";

const ProfileView = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === currentUser.uid;

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const targetUserId = isOwnProfile ? currentUser.uid : userId;
        const userDocRef = doc(firestore, "Users", targetUserId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "Anonymous");
          setBio(data.bio || "");
          setProfilePicUrl(data.profilePicUrl || "");
        } else {
          setError("User not found.");
        }
      } catch (err) {
        setError(firebaseErrorMessages(err.code));
      }
    };
    if (isOwnProfile || userId) {
      fetchUserData();
    }
  }, [currentUser, userId, isOwnProfile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (username.trim() === "") {
      setError("Username cannot be empty.");
      setLoading(false);
      return;
    }

    if (bio.length > 300) {
      setError("Bio cannot exceed 300 characters.");
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(firestore, "Users", currentUser.uid);
      const updatedData = { username, bio, updated_at: serverTimestamp() };

      if (image) {
        setUploading(true);

        const originalRef = ref(
          storage,
          `profile_pictures/${currentUser.uid}/original_${image.original.name}`
        );
        await uploadBytes(originalRef, image.original);
        const originalURL = await getDownloadURL(originalRef);

        const thumbnailRef = ref(
          storage,
          `profile_pictures/${currentUser.uid}/thumbnail_${image.thumbnail.name}`
        );
        await uploadBytes(thumbnailRef, image.thumbnail);
        const thumbnailURL = await getDownloadURL(thumbnailRef);

        updatedData.profilePicUrl = originalURL;
        updatedData.profilePicThumbnail = thumbnailURL;
        setProfilePicUrl(thumbnailURL);
        setUploading(false);
      }

      await updateDoc(userDocRef, updatedData);
      setMessage("Profile updated successfully!");
      setImage(null);
    } catch (err) {
      setError(firebaseErrorMessages(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setModalShow(true);
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm border-0 p-4 mb-4">
        <h2 className="text-center">
          {isOwnProfile ? "Your Profile" : `${username}'s Profile`}
        </h2>
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}
        {message && (
          <Alert variant="success" className="text-center">
            {message}
          </Alert>
        )}

        <Row className="align-items-center mb-4">
          <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
            <Image
              src={profilePicUrl || "/default-profile.png"}
              alt="Profile"
              roundedCircle
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                cursor: "pointer",
              }}
              onClick={() => handleImageClick(profilePicUrl)}
            />
          </Col>
          <Col xs={12} md={8}>
            {isOwnProfile ? (
              <Form onSubmit={handleProfileUpdate}>
                <Form.Group controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="bio" className="mt-3">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength="300"
                  />
                  <ProgressBar
                    now={(bio.length / 300) * 100}
                    label={`${bio.length}/300`}
                    className="mt-1"
                  />
                </Form.Group>

                <Form.Group controlId="profilePic" className="mt-3">
                  <Form.Label>Profile Picture</Form.Label>
                  <ImageUploader
                    onImageSelected={(files) => setImage(files)}
                    maxSize={5 * 1024 * 1024}
                    accept="image/*"
                  />
                </Form.Group>

                {uploading && (
                  <div className="mt-3">
                    <Spinner animation="border" size="sm" /> Uploading image...
                  </div>
                )}

                <Button
                  variant="primary"
                  type="submit"
                  className="mt-4"
                  disabled={loading || uploading}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </Form>
            ) : (
              <div>
                <p>
                  <strong>Username:</strong> {username}
                </p>
                <p>
                  <strong>Bio:</strong> {bio}
                </p>
                <FollowButton targetUserId={userId} />
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm border-0 p-4 mb-4">
        <h4 className="text-center mb-4">Activity</h4>
        <Row className="text-center">
          <Col xs={6}>
            <div className="p-3 border rounded bg-light">
              <FaUserFriends size={24} className="text-primary mb-2" />
              <FollowStats userId={isOwnProfile ? currentUser.uid : userId} />
            </div>
          </Col>
          <Col xs={6}>
            <div className="p-3 border rounded bg-light">
              <FaChartLine size={24} className="text-success mb-2" />
              <UserStats userId={isOwnProfile ? currentUser.uid : userId} />
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm border-0 p-4 mb-4">
        <UserPosts userId={isOwnProfile ? currentUser.uid : userId} />
      </Card>

      {isOwnProfile && (
        <Card className="shadow-sm border-0 p-4 mb-4">
          <DeleteAccount />
        </Card>
      )}

      <ImageModal
        show={modalShow}
        handleClose={() => setModalShow(false)}
        imageUrl={modalImageUrl}
        altText="Profile Picture"
      />
    </Container>
  );
};

export default ProfileView;
