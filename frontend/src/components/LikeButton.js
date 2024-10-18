import React, { useEffect, useState } from 'react';
import { firestore } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';

const LikeButton = ({ postId }) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const likeDocRef = doc(firestore, 'Posts', postId, 'Likes', currentUser.uid);
    const postDocRef = doc(firestore, 'Posts', postId);

    // Listener for the user's like status
    const unsubscribeLike = onSnapshot(likeDocRef, (docSnapshot) => {
      setLiked(docSnapshot.exists());
    });

    // Listener for the total like count
    const unsubscribeCount = onSnapshot(postDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLikeCount(data.likeCount || 0);
      }
    });

    return () => {
      unsubscribeLike();
      unsubscribeCount();
    };
  }, [currentUser, postId]);

  const toggleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts.');
      return;
    }

    const likeDocRef = doc(firestore, 'Posts', postId, 'Likes', currentUser.uid);
    const postDocRef = doc(firestore, 'Posts', postId);

    try {
      if (liked) {
        await deleteDoc(likeDocRef);
        await updateDoc(postDocRef, {
          likeCount: (likeCount || 1) - 1,
        });
      } else {
        await setDoc(likeDocRef, {
          userId: currentUser.uid,
          likedAt: new Date(),
        });
        await updateDoc(postDocRef, {
          likeCount: (likeCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('An error occurred while updating your like. Please try again.');
    }
  };

  return (
    <div className="d-flex align-items-center">
      <Button
        onClick={toggleLike}
        variant={liked ? 'danger' : 'outline-secondary'}
        size="sm"
      >
        {liked ? '❤️ Unlike' : '🤍 Like'}
      </Button>
      <span className="ms-2">{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
    </div>
  );
};

export default LikeButton;
