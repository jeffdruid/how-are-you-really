import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const UserStats = ({ userId }) => {
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total posts
        const postsQuery = query(
          collection(firestore, "Posts"),
          where("userId", "==", userId),
        );
        const postsSnapshot = await getDocs(postsQuery);
        setTotalPosts(postsSnapshot.size);

        // Calculate total likes
        let likesCount = 0;
        for (const postDoc of postsSnapshot.docs) {
          const postId = postDoc.id;
          const likesQuery = collection(firestore, "Posts", postId, "Likes");
          const likesSnapshot = await getDocs(likesQuery);
          likesCount += likesSnapshot.size;
        }
        setTotalLikes(likesCount);
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }
    };

    fetchStats();
  }, [userId]);

  return (
    <div className="mt-4">
      <p>
        <strong>Total Posts:</strong> {totalPosts}
      </p>
      <p>
        <strong>Total Likes Received:</strong> {totalLikes}
      </p>
    </div>
  );
};

export default UserStats;
