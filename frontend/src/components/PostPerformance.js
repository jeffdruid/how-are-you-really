import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// Register required components
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PostPerformance = () => {
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    likeCounts: [],
    postIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerformanceData = () => {
      if (!currentUser) return;

      const postsRef = collection(firestore, "Posts");
      const postsQuery = query(
        postsRef,
        where("userId", "==", currentUser.uid)
      );

      onSnapshot(
        postsQuery,
        (snapshot) => {
          const postPerformance = {
            labels: [],
            likeCounts: [],
            postIds: [],
          };

          snapshot.forEach((doc) => {
            const post = doc.data();
            postPerformance.labels.push(
              new Date(post.created_at.seconds * 1000).toLocaleDateString() ||
                `Post ${doc.id}`
            );
            postPerformance.likeCounts.push(post.likeCount || 0);
            postPerformance.postIds.push(doc.id);
          });

          setPerformanceData(postPerformance);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching performance data:", err);
          setError("Failed to load performance data.");
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
      navigate(`/posts/${postId}`);
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
        label: "Likes",
        data: performanceData.likeCounts,
        backgroundColor: "rgba(153,102,255,0.6)",
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
    },
    onClick: (event, elements) => handleBarClick(elements),
    maintainAspectRatio: false,
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Post Performance Insights</h3>
      <div
        style={{
          maxWidth: "75%",
          margin: "0 auto",
          cursor: "pointer",
          height: "400px",
        }}
      >
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default PostPerformance;
