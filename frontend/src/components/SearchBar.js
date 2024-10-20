import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false); // Track if search button was clicked

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearchSubmitted(true); // Mark the search as submitted

    try {
      // Search for users
      const usersRef = collection(firestore, 'Users');
      const userQuery = query(usersRef, where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'));
      const userSnapshot = await getDocs(userQuery);
      const foundUsers = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(foundUsers);

      // Search for posts
      const postsRef = collection(firestore, 'Posts');
      const postQuery = query(postsRef, where('content', '>=', searchTerm), where('content', '<=', searchTerm + '\uf8ff'));
      const postSnapshot = await getDocs(postQuery);
      const foundPosts = postSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(foundPosts);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setSearchSubmitted(false);
    setUsers([]);
    setPosts([]);
  };

  return (
    <div>
      <Form onSubmit={handleSearch}>
        <Form.Group controlId="searchTerm">
          <Form.Control
            type="text"
            placeholder="Search for users or posts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="primary" disabled={loading || searchTerm.trim() === ''}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Search'}
        </Button>
      </Form>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {searchSubmitted && !loading && (
        <div className="mt-4">
          <Button variant="secondary" onClick={handleCloseResults}>
            Close Results
          </Button>

          <div className="mt-4">
            <h4>Users</h4>
            {users.length === 0 ? <p>No users found</p> : (
              <ul>
                {users.map((user) => (
                  <li key={user.id}>
                    <Link to={`/users/${user.id}`}>{user.username}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <h4>Posts</h4>
            {posts.length === 0 ? <p>No posts found</p> : (
              <ul>
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/posts/${post.id}`}>{post.content}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
