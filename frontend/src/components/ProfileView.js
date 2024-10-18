// src/components/ProfileView.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore, storage } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Removed unused imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Removed deleteObject
import { useParams } from 'react-router-dom';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import DeleteAccount from './DeleteAccount'; // Import DeleteAccount component

const ProfileView = () => {
  const { currentUser } = useAuth();
  const { userId } = useParams(); // Extract userId from URL parameters
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

    // Basic validation
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
        updated_at: serverTimestamp(), // Now correctly defined
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
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>{isOwnProfile ? 'Your Profile' : `${username}'s Profile`}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      
      {profilePicUrl && (
        <div>
          <img
            src={profilePicUrl}
            alt="Profile"
            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
          />
        </div>
      )}

      {isOwnProfile ? (
        <form onSubmit={handleProfileUpdate}>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="4"
              maxLength="300"
            ></textarea>
            <p>{bio.length}/300</p>
          </div>
          <div>
            <label>Profile Picture:</label>
            <input type="file" accept="image/*" onChange={handleProfilePicChange} />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Bio:</strong> {bio}</p>
          {/* Add more fields or interactions if necessary */}
        </div>
      )}

      {isOwnProfile && (
        <>
          <hr />
          {/* Delete Account Section */}
          <DeleteAccount />
        </>
      )}
    </div>
  );
};

export default ProfileView;
