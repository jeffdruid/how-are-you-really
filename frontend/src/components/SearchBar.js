import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersResults, setUsersResults] = useState([]);
  const [postsResults, setPostsResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.trim() === '') return;

    setLoading(true);
    setUsersResults([]);
    setPostsResults([]);

    try {
      // Search Users
      const usersQuery = query(
        collection(firestore, 'Users'),
        where('username', '>=', searchTerm),
        where('username', '<=', searchTerm + '\uf8ff')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsersResults(usersData);

      // Search Posts
      const postsQuery = query(
        collection(firestore, 'Posts'),
        where('content', '>=', searchTerm),
        where('content', '<=', searchTerm + '\uf8ff')
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPostsResults(postsData);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search for users or posts..."
          value={searchTerm}
          onChange={handleInputChange}
          className="form-control"
        />
        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Display Search Results */}
      <div className="mt-4">
        <h4>Users</h4>
        {usersResults.length === 0 ? (
          <p>No users found</p>
        ) : (
          <ListGroup>
            {usersResults.map((user) => (
              <ListGroup.Item key={user.id}>
                <Link to={`/users/${user.id}`}>{user.username}</Link>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <h4 className="mt-4">Posts</h4>
        {postsResults.length === 0 ? (
          <p>No posts found</p>
        ) : (
          <ListGroup>
            {postsResults.map((post) => (
              <ListGroup.Item key={post.id}>
                <Link to={`/posts/${post.id}`}>{post.content.slice(0, 100)}...</Link>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
