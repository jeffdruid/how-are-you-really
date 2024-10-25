import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import Post from "./Post";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner, Alert } from "react-bootstrap";
import ResourceModal from "./ResourceModal"; // Import ResourceModal component

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [flaggedContent, setFlaggedContent] = useState(null); // For flagged content modal

  const POSTS_PER_PAGE = 2;

  useEffect(() => {
    const initialQuery = query(
      collection(firestore, "Posts"),
      where("is_visible", "==", true), // Fetch only visible posts
      orderBy("created_at", "desc"),
      limit(POSTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      initialQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        setLastDoc(lastVisible);

        if (snapshot.docs.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }
      },
      (err) => {
        console.error("Error fetching initial posts:", err);
        setError("Failed to load posts. Please try again later.");
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchMorePosts = async () => {
    if (!lastDoc) return;

    try {
      const nextQuery = query(
        collection(firestore, "Posts"),
        where("is_visible", "==", true),
        orderBy("created_at", "desc"),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(nextQuery);
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts((prevPosts) => [...prevPosts, ...postsData]);

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(newLastDoc);

      if (snapshot.docs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching more posts:", err);
      setError("Failed to load more posts. Please try again later.");
    }
  };

  const closeModal = () => setFlaggedContent(null);

  return (
    <div>
      <h3>Post Feed</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMorePosts}
        hasMore={hasMore}
        loader={
          <div className="text-center my-4">
            <Spinner animation="border" />
          </div>
        }
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>No more posts to display.</b>
          </p>
        }
      >
        {posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onFlaggedContent={setFlaggedContent}
            />
          ))
        )}
      </InfiniteScroll>

      {flaggedContent && (
        <ResourceModal
          show={!!flaggedContent}
          handleClose={closeModal}
          flaggedType={flaggedContent.flaggedType}
          message="This content has been flagged for moderation."
        />
      )}
    </div>
  );
};

export default PostFeed;
