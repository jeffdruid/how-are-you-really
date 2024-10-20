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
import { Form, Button, Container, Row, Col, Image, Alert, ProgressBar } from 'react-bootstrap';

const ProfileView = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === currentUser.uid;

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (profilePic) {
        const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
        await uploadBytes(storageRef, profilePic);
        const downloadURL = await getDownloadURL(storageRef);
        updatedData.profilePicUrl = downloadURL;
        setProfilePicUrl(downloadURL);
      }

      await updateDoc(userDocRef, updatedData);
      setMessage('Profile updated successfully!');
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
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

              <Form.Group controlId="profilePic" className="mt-3">
                <Form.Label>Profile Picture</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleProfilePicChange} />
              </Form.Group>

              <Button variant="primary" type="submit" className="mt-4" disabled={loading}>
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
        </Col>
      </Row>

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
