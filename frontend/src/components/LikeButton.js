import React, { useEffect, useState, useCallback } from 'react';
import { firestore } from '../firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  getDoc, // Import getDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';
import { increment } from 'firebase/firestore';

const LikeButton = ({ postId, commentId = null, replyId = null, postOwnerId = null }) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Memoize the function using useCallback to prevent re-creation on every render
  const getLikeDocRef = useCallback(() => {
    if (replyId) {
      return doc(
        firestore,
        'Posts',
        postId,
        'Comments',
        commentId,
        'Replies',
        replyId,
        'Likes',
        currentUser.uid
      );
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
          likeCount: increment(1),
        });

        // Create notification if liking and not own post/comment/reply
        if (currentUser.uid !== postOwnerId) {
          let notificationTargetUserId = postOwnerId;
          console.log('postOwnerId:', postOwnerId);
          if (commentId) {
            // Fetch comment owner ID
            const commentDocRef = doc(firestore, 'Posts', postId, 'Comments', commentId);
            const commentDoc = await getDoc(commentDocRef); // Use getDoc
            if (commentDoc.exists()) {
              notificationTargetUserId = commentDoc.data().userId;
            }
          } else if (replyId) {
            // Fetch reply owner ID
            const replyDocRef = doc(
              firestore,
              'Posts',
              postId,
              'Comments',
              commentId,
              'Replies',
              replyId
            );
            const replyDoc = await getDoc(replyDocRef); // Use getDoc
            if (replyDoc.exists()) {
              notificationTargetUserId = replyDoc.data().userId;
            }
          }
          if (!notificationTargetUserId) {
            console.error('Notification target user ID is undefined.');
            return;
          }

          if (currentUser.uid !== notificationTargetUserId) {
            console.log('notificationTargetUserId:', notificationTargetUserId);
            const notificationsRef = collection(
              firestore,
              'Users',
              notificationTargetUserId,
              'Notifications'
            );
            await addDoc(notificationsRef, {
              type: 'like',
              fromUserId: currentUser.uid,
              postId,
              commentId: commentId || null,
              replyId: replyId || null,
              created_at: serverTimestamp(),
              read: false,
            });
          }
        }
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
      <span className="ms-2">
        {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
      </span>
    </div>
  );
};

export default LikeButton;
