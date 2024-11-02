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
import { Spinner, Alert, Container, Card } from "react-bootstrap";
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
    <Container className="mt-4">
      {/* <h3 className="text-center mb-4">Post Feed</h3> */}

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMorePosts}
        hasMore={hasMore}
        loader={
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" />
          </div>
        }
        endMessage={
          <p className="text-center mt-4" style={{ color: "#6c757d" }}>
            <b>No more posts to display.</b>
          </p>
        }
      >
        {posts.length === 0 && !error ? (
          <p className="text-center text-muted mt-4">No posts available.</p>
        ) : (
          posts.map((post) => (
            <Card
              key={post.id}
              className="mb-4 shadow-sm"
              style={{ padding: "1.5rem", borderRadius: "8px" }}
            >
              <Post post={post} onFlaggedContent={setFlaggedContent} />
            </Card>
          ))
        )}
      </InfiniteScroll>

      {/* Modal for Flagged Content */}
      {flaggedContent && (
        <ResourceModal
          show={!!flaggedContent}
          handleClose={closeModal}
          flaggedType={flaggedContent.flaggedType}
          message="This content has been flagged for moderation."
        />
      )}
    </Container>
  );
};

export default PostFeed;
