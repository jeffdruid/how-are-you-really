import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Spinner, Alert } from "react-bootstrap";
import Post from "./Post";

const PostDetail = () => {
  const { id } = useParams(); // Get the post ID from the URL
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postRef = doc(firestore, "Posts", id);
        const postSnapshot = await getDoc(postRef);

        if (postSnapshot.exists()) {
          setPost({ id: postSnapshot.id, ...postSnapshot.data() });
        } else {
          setError("Post not found");
        }
      } catch (err) {
        setError("Error fetching post");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return <div>{post && <Post post={post} />}</div>;
};

export default PostDetail;
