import React, { useState } from "react";
import { firestore } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Button,
  Form,
  Spinner,
  Alert,
  Modal,
  ListGroup,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa"; // Import search icon from react-icons

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowResultsModal(true);

    try {
      // Search for users by username
      const usersRef = collection(firestore, "Users");
      const userQuery = query(
        usersRef,
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff"),
      );
      const userSnapshot = await getDocs(userQuery);
      const foundUsers = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(foundUsers);

      // Search for posts by content and visibility
      const postsRef = collection(firestore, "Posts");
      const postQuery = query(
        postsRef,
        where("content", ">=", searchTerm),
        where("content", "<=", searchTerm + "\uf8ff"),
        where("is_visible", "==", true), // Only fetch visible posts
      );
      const postSnapshot = await getDocs(postQuery);
      const foundPosts = postSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(foundPosts);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Close the modal and reset results
  const handleCloseModal = () => {
    setShowResultsModal(false);
    setUsers([]);
    setPosts([]);
    setSearchTerm("");
  };

  return (
    <>
      {/* Search Form */}
      <Form onSubmit={handleSearch} className="d-flex mb-3">
        <Form.Group controlId="searchTerm" className="flex-grow-1 me-2">
          <Form.Control
            type="text"
            placeholder="Search for users or posts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form.Group>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || searchTerm.trim() === ""}
        >
          {loading ? <Spinner animation="border" size="sm" /> : <FaSearch />}{" "}
          {/* Replaced text with icon */}
        </Button>
      </Form>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {/* Results Modal with fade animation */}
      <Modal
        show={showResultsModal}
        onHide={handleCloseModal}
        centered
        animation={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Search Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Users Section */}
          <h5>Users</h5>
          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <ListGroup variant="flush" className="mb-3">
              {users.map((user) => (
                <ListGroup.Item key={user.id}>
                  <Link
                    to={`/users/${user.id}`}
                    className="text-decoration-none"
                  >
                    {user.username}
                  </Link>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {/* Posts Section */}
          <h5>Posts</h5>
          {posts.length === 0 ? (
            <p>No posts found</p>
          ) : (
            <ListGroup variant="flush">
              {posts.map((post) => (
                <ListGroup.Item key={post.id}>
                  <Link
                    to={`/posts/${post.id}`}
                    className="text-decoration-none"
                  >
                    {post.content}
                  </Link>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SearchBar;
