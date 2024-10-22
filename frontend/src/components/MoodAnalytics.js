import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Spinner, Alert } from 'react-bootstrap';
import { ArcElement, Tooltip, Legend } from 'chart.js';
import { Chart } from 'chart.js';

const MoodAnalytics = () => {
  const [moodData, setMoodData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMoodAnalytics = () => {
      const postsRef = collection(firestore, 'Posts');
      const postsQuery = query(postsRef);
      
      Chart.register(ArcElement, Tooltip, Legend);  // Registering ArcElement, Tooltip, and Legend
      
      onSnapshot(
        postsQuery,
        (snapshot) => {
          const moodCounts = { happy: 0, sad: 0, anxious: 0 };

          snapshot.forEach((doc) => {
            const post = doc.data();
            if (post.mood) {
              moodCounts[post.mood] = (moodCounts[post.mood] || 0) + 1;
            }
          });

          setMoodData(moodCounts);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching mood analytics:', err);
          setError('Failed to load mood analytics.');
          setLoading(false);
        }
      );
    };

    fetchMoodAnalytics();
  }, []);

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const data = {
    labels: ['Happy', 'Sad', 'Anxious'],
    datasets: [
      {
        data: [moodData.happy, moodData.sad, moodData.anxious],
        backgroundColor: ['#ffcc00', '#ff4444', '#00ccff'],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom', // Displaying legend at the bottom
      },
      tooltip: {
        enabled: true, // Enabling tooltips
        callbacks: {
          label: function (tooltipItem) {
            const mood = tooltipItem.label;
            const value = tooltipItem.raw;
            return `${mood}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Mood Analytics</h3>
      <div style={{ maxWidth: '50%', margin: '0 auto' }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default MoodAnalytics;
