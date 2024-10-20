import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore, storage } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useParams } from 'react-router-dom';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import DeleteAccount from './DeleteAccount';
import FollowButton from './FollowButton';
import FollowStats from './FollowStats';
import { Form, Button, Container, Row, Col, Image, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import UserStats from './UserStats';
import UserPosts from './UserPosts';
import ImageUploader from './ImageUploader'; // Import the ImageUploader component

const ProfileView = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === currentUser.uid;

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for image upload
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const targetUserId = isOwnProfile ? currentUser.uid : userId;
        const userDocRef = doc(firestore, 'Users', targetUserId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || 'Anonymous');
          setBio(data.bio || '');
          setProfilePicUrl(data.profilePicUrl || '');
        } else {
          setError('User not found.');
        }
      } catch (err) {
        const friendlyMessage = firebaseErrorMessages(err.code);
        setError(friendlyMessage);
      }
    };

    if (isOwnProfile || userId) {
      fetchUserData();
    }
  }, [currentUser, userId, isOwnProfile]);

  const handleProfileUpdate = async (e) => {
    if (!isOwnProfile) return;
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (username.trim() === '') {
      setError('Username cannot be empty.');
      setLoading(false);
      return;
    }

    if (bio.length > 300) {
      setError('Bio cannot exceed 300 characters.');
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(firestore, 'Users', currentUser.uid);
      const updatedData = {
        username,
        bio,
        updated_at: serverTimestamp(),
      };

      if (image) {
        setUploading(true);

        // Create a unique file name using userId and image name
        const imageRef = ref(storage, `profile_pictures/${currentUser.uid}/${image.name}`);

        // Upload the image
        await uploadBytes(imageRef, image);

        // Get the download URL
        const downloadURL = await getDownloadURL(imageRef);

        // Update the post document with the image URL
        updatedData.profilePicUrl = downloadURL;
        setProfilePicUrl(downloadURL);
        setUploading(false);
      }

      await updateDoc(userDocRef, updatedData);
      setMessage('Profile updated successfully!');
      setImage(null);
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h2>{isOwnProfile ? 'Your Profile' : `${username}'s Profile`}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Row className="align-items-center mb-4">
        <Col xs={12} md={3}>
          {profilePicUrl && (
            <Image
              src={profilePicUrl}
              alt="Profile"
              roundedCircle
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
          )}
        </Col>
        <Col xs={12} md={9}>
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
                  rows={4}
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

              {/* Replace the existing File Input with ImageUploader */}
              <Form.Group controlId="profilePic" className="mt-3">
                <Form.Label>Profile Picture</Form.Label>
                <ImageUploader
                  onImageSelected={(file) => setImage(file)}
                  maxSize={5 * 1024 * 1024} // 5MB
                  accept="image/*"
                />
              </Form.Group>

              {/* Display upload progress */}
              {uploading && (
                <div className="mt-3">
                  <Spinner animation="border" size="sm" /> Uploading image...
                </div>
              )}

              <Button variant="primary" type="submit" className="mt-4" disabled={loading || uploading}>
                {loading ? 'Updating...' : 'Update Profile'}
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
              {/* Follow Button */}
              <FollowButton targetUserId={userId} />
            </div>
          )}
          {/* Follow Stats */}
          <FollowStats userId={isOwnProfile ? currentUser.uid : userId} />
          <UserStats userId={isOwnProfile ? currentUser.uid : userId} />
        </Col>
      </Row>
      <UserPosts userId={isOwnProfile ? currentUser.uid : userId} />

      {isOwnProfile && (
        <>
          <hr />
          {/* Delete Account Section */}
          <DeleteAccount />
        </>
      )}
    </Container>
  );
};

export default ProfileView;
