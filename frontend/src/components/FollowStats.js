// FollowStats.js

import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const FollowStats = ({ userId }) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsubscribeFollowers;
    let unsubscribeFollowing;

    const fetchFollowCounts = () => {
      try {
        // Real-time listener for followers
        const followersQuery = query(
          collection(firestore, 'Follows'),
          where('followingId', '==', userId)
        );
        unsubscribeFollowers = onSnapshot(followersQuery, (snapshot) => {
          setFollowersCount(snapshot.size);
        });

        // Real-time listener for following
        const followingQuery = query(
          collection(firestore, 'Follows'),
          where('followerId', '==', userId)
        );
        unsubscribeFollowing = onSnapshot(followingQuery, (snapshot) => {
          setFollowingCount(snapshot.size);
        });
      } catch (err) {
        console.error('Failed to fetch follow counts:', err);
        setError('Failed to fetch follow counts.');
      }
    };

    fetchFollowCounts();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeFollowers) unsubscribeFollowers();
      if (unsubscribeFollowing) unsubscribeFollowing();
    };
  }, [userId]);

  if (error) {
    // Optionally, display the error to the user
    console.error(error);
  }

  return (
    <div className="mt-4">
      <p>
        <strong>Followers:</strong> {followersCount}
      </p>
      <p>
        <strong>Following:</strong> {followingCount}
      </p>
    </div>
  );
};

export default FollowStats;
