import React, { useEffect, useState, useCallback } from 'react';
import { firestore } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';

const LikeButton = ({ postId, commentId, replyId }) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Memoize the function using useCallback to prevent re-creation on every render
  const getLikeDocRef = useCallback(() => {
    if (replyId) {
      return doc(firestore, 'Posts', postId, 'Comments', commentId, 'Replies', replyId, 'Likes', currentUser.uid);
    } else if (commentId) {
      return doc(firestore, 'Posts', postId, 'Comments', commentId, 'Likes', currentUser.uid);
    } else {
      return doc(firestore, 'Posts', postId, 'Likes', currentUser.uid);
    }
  }, [postId, commentId, replyId, currentUser.uid]);

  const getItemDocRef = useCallback(() => {
    if (replyId) {
      return doc(firestore, 'Posts', postId, 'Comments', commentId, 'Replies', replyId);
    } else if (commentId) {
      return doc(firestore, 'Posts', postId, 'Comments', commentId);
    } else {
      return doc(firestore, 'Posts', postId);
    }
  }, [postId, commentId, replyId]);

  useEffect(() => {
    if (!currentUser) return;

    const likeDocRef = getLikeDocRef();
    const itemDocRef = getItemDocRef();

    // Listener for the user's like status
    const unsubscribeLike = onSnapshot(likeDocRef, (docSnapshot) => {
      setLiked(docSnapshot.exists());
    });

    // Listener for the total like count
    const unsubscribeCount = onSnapshot(itemDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setLikeCount(data.likeCount || 0);
      }
    });

    return () => {
      unsubscribeLike();
      unsubscribeCount();
    };
  }, [currentUser, getLikeDocRef, getItemDocRef]);

  const toggleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts.');
      return;
    }

    const likeDocRef = getLikeDocRef();
    const itemDocRef = getItemDocRef();

    try {
      if (liked) {
        // Unlike: delete the like document and decrease the like count
        await deleteDoc(likeDocRef);
        await updateDoc(itemDocRef, {
          likeCount: (likeCount || 1) - 1,
        });
      } else {
        // Like: create the like document and increase the like count
        await setDoc(likeDocRef, {
          userId: currentUser.uid,
          likedAt: new Date(),
        });
        await updateDoc(itemDocRef, {
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
