import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../firebase";

export const updateUsernameEverywhere = async (
  userId,
  newUsername,
  setProgress,
) => {
  try {
    let totalDocs = 0; // Total docs to update
    let processedDocs = 0; // Counter for processed documents
    const batch = writeBatch(firestore);

    const updateProgress = () => {
      setProgress(Math.round((processedDocs / totalDocs) * 100));
    };

    // Fetch posts concurrently
    const postsSnapshot = await getDocs(
      query(collection(firestore, "Posts"), where("userId", "==", userId)),
    );
    totalDocs += postsSnapshot.size;

    // Update posts
    postsSnapshot.docs.forEach((postDoc) => {
      batch.update(postDoc.ref, { username: newUsername });
      processedDocs += 1;
      updateProgress();
    });

    // Fetch and process comments and replies concurrently
    const processCommentsAndReplies = async (postDocRef) => {
      const commentsRef = collection(postDocRef, "Comments");
      const commentsSnapshot = await getDocs(
        query(commentsRef, where("userId", "==", userId)),
      );

      totalDocs += commentsSnapshot.size;

      await Promise.all(
        commentsSnapshot.docs.map(async (commentDoc) => {
          batch.update(commentDoc.ref, { username: newUsername });
          processedDocs += 1;
          updateProgress();

          const repliesRef = collection(commentDoc.ref, "Replies");
          const repliesSnapshot = await getDocs(
            query(repliesRef, where("userId", "==", userId)),
          );

          totalDocs += repliesSnapshot.size;

          repliesSnapshot.docs.forEach((replyDoc) => {
            batch.update(replyDoc.ref, { username: newUsername });
            processedDocs += 1;
            updateProgress();
          });
        }),
      );
    };

    // Process all posts concurrently
    await Promise.all(
      postsSnapshot.docs.map((postDoc) =>
        processCommentsAndReplies(postDoc.ref),
      ),
    );

    // Commit batch updates
    await batch.commit();
    setProgress(100);
    console.log("Username updated everywhere successfully.");
  } catch (error) {
    console.error("Error updating username everywhere:", error.message, error);
  }
};
