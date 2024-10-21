import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';

const FollowButton = ({ targetUserId }) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (currentUser && targetUserId) {
        try {
          const q = query(
            collection(firestore, 'Follows'),
            where('followerId', '==', currentUser.uid),
            where('followingId', '==', targetUserId)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setIsFollowing(true);
            setFollowDocId(querySnapshot.docs[0].id);
          } else {
            setIsFollowing(false);
            setFollowDocId(null);
          }
        } catch (err) {
          console.error('Failed to check following status:', err);
          setError('Failed to check following status.');
        }
      }
    };

    checkFollowingStatus();
  }, [currentUser, targetUserId]);

  const handleFollow = async () => {
    try {
      const docRef = await addDoc(collection(firestore, 'Follows'), {
        followerId: currentUser.uid,
        followingId: targetUserId,
        created_at: serverTimestamp(),
      });
      setIsFollowing(true);
      setFollowDocId(docRef.id);

      // Create notification if not following self
      if (currentUser.uid !== targetUserId) {
        const notificationsRef = collection(firestore, 'Users', targetUserId, 'Notifications');
        await addDoc(notificationsRef, {
          type: 'follow',
          fromUserId: currentUser.uid,
          created_at: serverTimestamp(),
          read: false,
        });
      }
    } catch (err) {
      console.error('Failed to follow user:', err);
      setError('Failed to follow user.');
    }
  };

  const handleUnfollow = async () => {
    try {
      if (followDocId) {
        await deleteDoc(doc(firestore, 'Follows', followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
      }
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      setError('Failed to unfollow user.');
    }
  };

  if (error) {
    // Optionally, display the error to the user
    console.error(error);
  }

  // Do not render the button if viewing own profile
  if (currentUser.uid === targetUserId) {
    return null;
  }

  return (
    <Button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      variant={isFollowing ? 'danger' : 'primary'}
      className="mt-3"
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};

export default FollowButton;
