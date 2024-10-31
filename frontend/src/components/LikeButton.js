import React, { useEffect, useState, useCallback } from "react";
import { firestore } from "../firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  increment,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "react-bootstrap";

const LikeButton = ({
  postId,
  commentId = null,
  replyId = null,
  postOwnerId = null,
}) => {
  const { currentUser } = useAuth(); // Authenticated user information
  const [liked, setLiked] = useState(false); // Track like status
  const [likeCount, setLikeCount] = useState(0); // Track total like count

  // Generate the correct document reference for the like based on whether it's a post, comment, or reply
  const getLikeDocRef = useCallback(() => {
    if (replyId) {
      return doc(
        firestore,
        "Posts",
        postId,
        "Comments",
        commentId,
        "Replies",
        replyId,
        "Likes",
        currentUser.uid
      );
    } else if (commentId) {
      return doc(
        firestore,
        "Posts",
        postId,
        "Comments",
        commentId,
        "Likes",
        currentUser.uid
      );
    } else {
      return doc(firestore, "Posts", postId, "Likes", currentUser.uid);
    }
  }, [postId, commentId, replyId, currentUser.uid]);

  // Generate the document reference for the item (post/comment/reply) being liked
  const getItemDocRef = useCallback(() => {
    if (replyId) {
      return doc(
        firestore,
        "Posts",
        postId,
        "Comments",
        commentId,
        "Replies",
        replyId
      );
    } else if (commentId) {
      return doc(firestore, "Posts", postId, "Comments", commentId);
    } else {
      return doc(firestore, "Posts", postId);
    }
  }, [postId, commentId, replyId]);

  // Set up listeners for both like status and total like count
  useEffect(() => {
    if (!currentUser) return;

    const likeDocRef = getLikeDocRef(); // Document reference for the like
    const itemDocRef = getItemDocRef(); // Document reference for the liked item

    // Listen for changes to the user's like status (whether they've liked it or not)
    const unsubscribeLike = onSnapshot(likeDocRef, (docSnapshot) => {
      setLiked(docSnapshot.exists());
    });

    // Listen for changes to the total like count for the item
    const unsubscribeCount = onSnapshot(itemDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setLikeCount(docSnapshot.data().likeCount || 0);
      }
    });

    return () => {
      unsubscribeLike(); // Clean up like listener
      unsubscribeCount(); // Clean up count listener
    };
  }, [currentUser, getLikeDocRef, getItemDocRef]);

  // Toggle the like status when the button is clicked
  const toggleLike = async () => {
    if (!currentUser) {
      alert("Please log in to like posts.");
      return;
    }

    const likeDocRef = getLikeDocRef(); // Reference for the like document
    const itemDocRef = getItemDocRef(); // Reference for the liked item

    try {
      if (liked) {
        // If the user has liked it, unlike the item by deleting the like document and decrementing the count
        await deleteDoc(likeDocRef);
        await updateDoc(itemDocRef, {
          likeCount: (likeCount || 1) - 1,
        });
      } else {
        // If the user hasn't liked it, add a like document and increment the count
        await setDoc(likeDocRef, {
          userId: currentUser.uid,
          likedAt: new Date(),
        });
        await updateDoc(itemDocRef, {
          likeCount: increment(1),
        });

        // Send notification to the owner if they are not the current user
        if (currentUser.uid !== postOwnerId) {
          let notificationTargetUserId = postOwnerId;
          if (commentId) {
            // Fetch comment owner ID if this is a comment like
            const commentDocRef = doc(
              firestore,
              "Posts",
              postId,
              "Comments",
              commentId
            );
            const commentDoc = await getDoc(commentDocRef);
            if (commentDoc.exists()) {
              notificationTargetUserId = commentDoc.data().userId;
            }
          } else if (replyId) {
            // Fetch reply owner ID if this is a reply like
            const replyDocRef = doc(
              firestore,
              "Posts",
              postId,
              "Comments",
              commentId,
              "Replies",
              replyId
            );
            const replyDoc = await getDoc(replyDocRef);
            if (replyDoc.exists()) {
              notificationTargetUserId = replyDoc.data().userId;
            }
          }
          if (!notificationTargetUserId) return;

          if (currentUser.uid !== notificationTargetUserId) {
            // Add the like notification to the owner's notifications collection
            const notificationsRef = collection(
              firestore,
              "Users",
              notificationTargetUserId,
              "Notifications"
            );
            await addDoc(notificationsRef, {
              type: "like",
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
      console.error("Error toggling like:", error);
      alert("An error occurred while updating your like. Please try again.");
    }
  };

  // Render the like button with the like count inside
  return (
    <Button
      onClick={toggleLike}
      variant={liked ? "danger" : "outline-secondary"}
      size="sm"
      className="d-flex align-items-center"
    >
      {liked ? "❤️" : "🤍"} {likeCount}{" "}
      {/* Show like count inside the button */}
    </Button>
  );
};

export default LikeButton;
