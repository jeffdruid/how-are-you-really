// src/components/Profile.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore, storage } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseErrorMessages } from '../utils/firebaseErrors';

const Profile = () => {
  const { currentUser } = useAuth();
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
        const userDocRef = doc(firestore, 'Users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || '');
          setBio(data.bio || '');
          setProfilePicUrl(data.profilePicUrl || '');
        }
      } catch (err) {
        const friendlyMessage = firebaseErrorMessages(err.code);
        setError(friendlyMessage);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
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
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>User Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
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
          ></textarea>
        </div>
        <div>
          <label>Profile Picture:</label>
          {profilePicUrl && (
            <div>
              <img
                src={profilePicUrl}
                alt="Profile"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleProfilePicChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
