import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // For navigation

const PostPerformance = () => {
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerformanceData = () => {
      if (!currentUser) return;

      const postsRef = collection(firestore, 'Posts');
      const postsQuery = query(postsRef, where('userId', '==', currentUser.uid));

      onSnapshot(
        postsQuery,
        (snapshot) => {
          const postPerformance = {
            labels: [],
            likeCounts: [],
            commentCounts: [],
            postIds: [], // Store post IDs for linking
          };

          snapshot.forEach((doc) => {
            const post = doc.data();
            postPerformance.labels.push(new Date(post.created_at.seconds * 1000).toLocaleDateString() || `Post ${doc.id}`); // Date of post
            postPerformance.likeCounts.push(post.likeCount || 0);
            postPerformance.commentCounts.push(post.commentCount || 0);
            postPerformance.postIds.push(doc.id); // Store post ID
          });

          setPerformanceData(postPerformance);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching performance data:', err);
          setError('Failed to load performance data.');
          setLoading(false);
        }
      );
    };

    fetchPerformanceData();
  }, [currentUser]);

  const handleBarClick = (elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const postId = performanceData.postIds[elementIndex];
      navigate(`/posts/${postId}`); // Navigate to the post detail page
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const data = {
    labels: performanceData.labels,
    datasets: [
      {
        label: 'Likes',
        data: performanceData.likeCounts,
        backgroundColor: 'rgba(153,102,255,0.6)',
      },
      {
        label: 'Comments',
        data: performanceData.commentCounts,
        backgroundColor: 'rgba(255,159,64,0.6)',
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    onClick: (event, elements) => handleBarClick(elements), // Add click event to bars
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Post Performance Insights</h3>
      <div style={{ maxWidth: '75%', margin: '0 auto', cursor: 'pointer' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default PostPerformance;
