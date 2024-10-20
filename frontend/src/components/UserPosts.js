import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import Post from './Post';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Spinner, Alert } from 'react-bootstrap';

const UserPosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const POSTS_PER_PAGE = 2;

  // Fetch initial user posts
  const fetchInitialPosts = async () => {
    try {
      const initialQuery = query(
        collection(firestore, 'Posts'),
        where('userId', '==', userId),
        where('isAnonymous', '==', false),
        orderBy('created_at', 'desc'),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(initialQuery);
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);

      if (snapshot.docs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setError('Failed to load user posts. Please try again later.');
    }
  };

  // Fetch more user posts
  const fetchMorePosts = async () => {
    if (!lastDoc) return;

    try {
      const nextQuery = query(
        collection(firestore, 'Posts'),
        where('userId', '==', userId),
        where('isAnonymous', '==', false),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(nextQuery);
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(prevPosts => [...prevPosts, ...postsData]);

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(newLastDoc);

      if (snapshot.docs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching more user posts:', err);
      setError('Failed to load more user posts. Please try again later.');
    }
  };

  useEffect(() => {
    // Reset state when userId changes
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setError('');
    fetchInitialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div>
      <h3>User Posts</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMorePosts}
        hasMore={hasMore}
        loader={<div className="text-center my-4"><Spinner animation="border" /></div>}
        endMessage={
          <p style={{ textAlign: 'center' }}>
            <b>No more posts to display.</b>
          </p>
        }
      >
        {posts.length === 0 ? (
          <p>This user hasn't posted anything yet.</p>
        ) : (
          posts.map(post => <Post key={post.id} post={post} />)
        )}
      </InfiniteScroll>
    </div>
  );
};

export default UserPosts;
