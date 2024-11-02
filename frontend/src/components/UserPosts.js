import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import Post from "./Post";
import InfiniteScroll from "react-infinite-scroll-component";
import { Spinner, Alert, Button, Collapse, Card } from "react-bootstrap";

const UserPosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const POSTS_PER_PAGE = 5;

  // Fetch initial user posts
  const fetchInitialPosts = async () => {
    try {
      const initialQuery = query(
        collection(firestore, "Posts"),
        where("userId", "==", userId),
        where("is_visible", "==", true),
        where("isAnonymous", "==", false),
        orderBy("created_at", "desc"),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(initialQuery);
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
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setError("Failed to load user posts. Please try again later.");
    }
  };

  // Fetch more user posts
  const fetchMorePosts = async () => {
    if (!lastDoc) return;

    try {
      const nextQuery = query(
        collection(firestore, "Posts"),
        where("userId", "==", userId),
        where("is_visible", "==", true),
        where("isAnonymous", "==", false),
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
      console.error("Error fetching more user posts:", err);
      setError("Failed to load more user posts. Please try again later.");
    }
  };

  useEffect(() => {
    // Reset state when userId changes
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setError("");
    fetchInitialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <Card className="shadow-sm border-0 p-4 mb-4">
      <h4 className="text-center mb-3">User Posts</h4>

      {/* Toggle Button for Posts */}
      <Button
        onClick={() => setOpen(!open)}
        aria-controls="user-posts-list"
        aria-expanded={open}
        variant="outline-dark"
        className="mb-3 mx-auto d-block"
      >
        {open ? "Hide User Posts" : "Show User Posts"}
      </Button>

      {/* Collapsible Posts */}
      <Collapse in={open}>
        <div id="user-posts-list">
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
              <p className="text-center text-muted">
                <strong>No more posts to display.</strong>
              </p>
            }
          >
            {posts.length === 0 ? (
              <p className="text-center text-muted">
                This user hasn't posted anything yet.
              </p>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="mb-4 shadow-sm"
                  style={{ padding: "1.5rem", borderRadius: "8px" }}
                >
                  <Post post={post} />
                </Card>
              ))
            )}
          </InfiniteScroll>
        </div>
      </Collapse>
    </Card>
  );
};

export default UserPosts;
