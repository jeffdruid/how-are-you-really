import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import UserListModal from "./UserListModal";

const FollowStats = ({ userId }) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("followers");

  useEffect(() => {
    let unsubscribeFollowers;
    let unsubscribeFollowing;

    const fetchFollowCounts = () => {
      try {
        // Real-time listener for followers
        const followersQuery = query(
          collection(firestore, "Follows"),
          where("followingId", "==", userId),
        );
        unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
          setFollowersCount(snapshot.size);
        });

        // Real-time listener for following
        const followingQuery = query(
          collection(firestore, "Follows"),
          where("followerId", "==", userId),
        );
        unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
          setFollowingCount(snapshot.size);
        });
      } catch (err) {
        console.error("Failed to fetch follow counts:", err);
        setError("Failed to fetch follow counts.");
      }
    };

    fetchFollowCounts();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeFollowers) unsubscribeFollowers();
      if (unsubscribeFollowing) unsubscribeFollowing();
    };
  }, [userId]);

  const handleShowFollowers = () => {
    setModalType("followers");
    setShowModal(true);
  };

  const handleShowFollowing = () => {
    setModalType("following");
    setShowModal(true);
  };

  if (error) {
    console.error(error);
  }

  return (
    <div className="mt-4">
      <p>
        <strong>Followers:</strong>{" "}
        <span
          onClick={handleShowFollowers}
          style={{ cursor: "pointer", color: "blue" }}
        >
          {followersCount}
        </span>
      </p>
      <p>
        <strong>Following:</strong>{" "}
        <span
          onClick={handleShowFollowing}
          style={{ cursor: "pointer", color: "blue" }}
        >
          {followingCount}
        </span>
      </p>

      {/* User List Modal */}
      <UserListModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        userId={userId}
        type={modalType}
      />
    </div>
  );
};

export default FollowStats;
