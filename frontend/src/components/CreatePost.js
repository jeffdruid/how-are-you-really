import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebaseErrorMessages } from '../utils/firebaseErrors';

const CreatePost = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('happy');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch username from Firestore when component mounts
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userDocRef = doc(firestore, 'Users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || 'Anonymous');
        } else {
          setUsername('Anonymous'); // Fallback if user document doesn't exist
        }
      } catch (err) {
        console.error('Error fetching username:', err);
        setUsername('Anonymous'); // Fallback on error
      }
    };

    if (currentUser) {
      fetchUsername();
    }
  }, [currentUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (content.trim() === '') {
      setError('Post content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(firestore, 'Posts'), {
        userId: currentUser.uid, // Always set userId to currentUser.uid
        username: isAnonymous ? 'Anonymous' : username, // Set username based on isAnonymous
        content,
        mood,
        isAnonymous,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      setContent('');
      setMood('happy');
      setIsAnonymous(false);
      // Optionally, show a success message or toast notification
      console.log('Post created successfully');
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Create a New Post</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleCreatePost}>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows="4"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', borderColor: '#ccc' }}
          ></textarea>
        </div>
        <div>
          <label>Mood:</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
            <option value="happy">😊 Happy</option>
            <option value="sad">😢 Sad</option>
            <option value="anxious">😟 Anxious</option>
            {/* Add more moods as needed */}
          </select>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Post Anonymously
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
