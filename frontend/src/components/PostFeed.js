import React, { useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import Post from './Post'; 

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const POSTS_PER_PAGE = 10;

  // Fetch initial posts
  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const initialQuery = query(
          collection(firestore, 'Posts'),
          orderBy('created_at', 'desc'),
          limit(POSTS_PER_PAGE)
        );

        const unsubscribe = onSnapshot(initialQuery, (snapshot) => {
          const postsData = [];
          snapshot.forEach((doc) => postsData.push({ id: doc.id, ...doc.data() }));
          setPosts(postsData);
          const lastVisible = snapshot.docs[snapshot.docs.length - 1];
          setLastDoc(lastVisible);
          if (snapshot.docs.length < POSTS_PER_PAGE) {
            setHasMore(false);
          }
        }, (error) => {
          console.error('Error fetching posts:', error);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching initial posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, []);

  // Memoize fetchMorePosts to prevent unnecessary re-creations
  const fetchMorePosts = useCallback(async () => {
    if (!lastDoc) return;

    setLoading(true);
    try {
      const nextQuery = query(
        collection(firestore, 'Posts'),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(nextQuery);
      const postsData = [];
      snapshot.forEach((doc) => postsData.push({ id: doc.id, ...doc.data() }));
      setPosts((prevPosts) => [...prevPosts, ...postsData]);

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(newLastDoc);

      if (snapshot.docs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching more posts:', err);
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  // Handle scroll event for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        fetchMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, fetchMorePosts]);

  return (
    <div>
      <h3>Post Feed</h3>
      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => <Post key={post.id} post={post} />)
      )}
      {loading && <p>Loading more posts...</p>}
      {!hasMore && <p>No more posts to display.</p>}
    </div>
  );
};

export default PostFeed;
