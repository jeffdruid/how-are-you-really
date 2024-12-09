import React, { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import { Spinner, Alert } from "react-bootstrap";
import { ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "chart.js";

const MoodAnalytics = () => {
  const [moodData, setMoodData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMoodAnalytics = () => {
      const postsRef = collection(firestore, "Posts");
      const postsQuery = query(postsRef);

      Chart.register(ArcElement, Tooltip, Legend); // Registering ArcElement, Tooltip, and Legend

      onSnapshot(
        postsQuery,
        (snapshot) => {
          const moodCounts = {
            happy: 0,
            sad: 0,
            anxious: 0,
            excited: 0,
            angry: 0,
            stressed: 0,
            calm: 0,
            grateful: 0,
          };

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
          console.error("Error fetching mood analytics:", err);
          setError("Failed to load mood analytics.");
          setLoading(false);
        },
      );
    };

    fetchMoodAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> Loading Mood Data...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center mt-5">
        {error}
      </Alert>
    );
  }

  const labels = Object.keys(moodData).map(
    (mood) => mood.charAt(0).toUpperCase() + mood.slice(1),
  );
  const dataValues = Object.values(moodData);

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          "#FFCE56", // Bright Yellow for "Happy"
          "#FF6384", // Vivid Red for "Sad"
          "#36ffff", // Vivid Blue for "Anxious"
          "#32CD32", // Lime Green for "Excited"
          "#9966FF", // Purple for "Angry"
          "#FFC0CB", // Pink for "Stressed"
          "#4BC0C0", // Teal for "Calm"
          "#FF9F40", // Orange for "Grateful"
        ],
        hoverBackgroundColor: [
          "#FFCE56CC",
          "#FF6384CC",
          "#36ffffCC",
          "#32CD32CC",
          "#9966FFCC",
          "#FFC0CBCC",
          "#4BC0C0CC",
          "#FF9F40CC",
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: {
            size: 12,
          },
          padding: 10,
        },
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
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div
      className="mood-analytics-container"
      style={{ textAlign: "center", padding: "2rem 0" }}
    >
      <h3 className="mb-4">Mood Analytics</h3>
      <div style={{ maxWidth: "60%", margin: "0 auto", minHeight: "300px" }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default MoodAnalytics;
