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
import { FaSearch } from "react-icons/fa";
import { generateSearchableWords } from "../utils/textUtils";

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

    const normalizedSearchTerm = searchTerm
      .toLowerCase()
      .replace(/[^\w\s]/g, ""); // Remove punctuation
    const searchWords = generateSearchableWords(normalizedSearchTerm);

    console.log("Search initiated with term:", searchTerm);
    console.log("Converted search term to lowercase:", normalizedSearchTerm);
    console.log("Search words:", searchWords);

    try {
      console.log("Searching for users...");
      const usersRef = collection(firestore, "Users");
      // const userQuery = query(
      //   usersRef,
      //   where("username_lower", ">=", normalizedSearchTerm),
      //   where("username_lower", "<=", normalizedSearchTerm + "\uf8ff"),
      // );
      const userQuery = query(
        usersRef,
        where("username_words", "array-contains", normalizedSearchTerm), // Match normalized term
      );

      const userSnapshot = await getDocs(userQuery);
      const foundUsers = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Users found:", foundUsers);
      setUsers(foundUsers);

      console.log("Searching for posts...");
      const postsRef = collection(firestore, "Posts");
      const postQuery = query(
        postsRef,
        where("content_words", "array-contains-any", searchWords),
        where("is_visible", "==", true),
      );
      const postSnapshot = await getDocs(postQuery);
      const foundPosts = postSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Posts found:", foundPosts);
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
    console.log("Closing results modal and resetting state.");
    setShowResultsModal(false);
    setUsers([]);
    setPosts([]);
    setSearchTerm("");
  };

  return (
    <>
      {/* Search Form */}
      <Form onSubmit={handleSearch} className="d-flex mt-1">
        <Form.Group controlId="searchTerm" className="flex-grow-1 me-2">
          <Form.Control
            type="text"
            placeholder="Search for users or posts"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              console.log("Search term updated:", e.target.value);
            }}
          />
        </Form.Group>
        <Button
          type="submit"
          variant="secondary"
          disabled={loading || searchTerm.trim() === ""}
        >
          {loading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
        </Button>
      </Form>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {/* Results Modal */}
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
