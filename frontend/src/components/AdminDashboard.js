import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [triggerWords, setTriggerWords] = useState([]);
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [newTriggerCategory, setNewTriggerCategory] = useState("");
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [editWord, setEditWord] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) {
        setError("Access restricted to administrators only.");
        return;
      }

      try {
        const flaggedResponse = await axios.get(
          "http://127.0.0.1:8000/api/flagged-content/",
          {
            headers: { Authorization: `Bearer ${currentUser.accessToken}` },
          }
        );
        setFlaggedContent(flaggedResponse.data);

        const triggerWordsResponse = await axios.get(
          "http://127.0.0.1:8000/api/triggerwords/",
          {
            headers: { Authorization: `Bearer ${currentUser.accessToken}` },
          }
        );
        setTriggerWords(triggerWordsResponse.data);
      } catch (err) {
        setError("Error fetching data. Make sure you have admin permissions.");
        console.error("Admin fetch error:", err);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, isAdmin]);

  // Approve flagged content
  //   TODO: Implement handleApproveFlaggedContent
  const handleApproveFlaggedContent = async (id) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/flagged-content/${id}/`,
        { reviewed: true, is_visible: true },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setFlaggedContent(
        flaggedContent.map((item) => (item.id === id ? response.data : item))
      );
    } catch (error) {
      console.error(
        "Error approving flagged content:",
        error.response?.data || error
      );
    }
  };

  // Create Trigger Word with Category
  const handleAddTriggerWord = async () => {
    if (!newTriggerWord || !newTriggerCategory) {
      console.error("Trigger word and category cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/triggerwords/",
        { word: newTriggerWord, category: newTriggerCategory },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setTriggerWords([...triggerWords, response.data]);
      setNewTriggerWord("");
      setNewTriggerCategory("");
    } catch (error) {
      console.error(
        "Error adding trigger word:",
        error.response?.data || error
      );
    }
  };

  // Delete Flagged Content
  const handleDeleteFlaggedContent = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/flagged-content/${id}/`, {
        headers: { Authorization: `Bearer ${currentUser.accessToken}` },
      });
      setFlaggedContent(flaggedContent.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting flagged content:", error);
    }
  };

  // Delete Trigger Word
  const handleDeleteTriggerWord = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/triggerwords/${id}/`, {
        headers: { Authorization: `Bearer ${currentUser.accessToken}` },
      });
      setTriggerWords(triggerWords.filter((word) => word.id !== id));
    } catch (error) {
      console.error("Error deleting trigger word:", error);
    }
  };

  // Enable Edit Mode
  const handleEditClick = (word) => {
    setEditingTrigger(word.id);
    setEditWord(word.word);
    setEditCategory(word.category);
  };

  // Update Trigger Word
  const handleUpdateTriggerWord = async (id) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/triggerwords/${id}/`,
        { word: editWord, category: editCategory },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setTriggerWords(
        triggerWords.map((item) => (item.id === id ? response.data : item))
      );
      setEditingTrigger(null); // Exit edit mode
    } catch (error) {
      console.error(
        "Error updating trigger word:",
        error.response?.data || error
      );
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {error && <p>{error}</p>}

      {isAdmin && (
        <>
          {/* Flagged Content */}
          <div>
            <h3>Flagged Content</h3>
            <ul>
              {flaggedContent.map((item) => (
                <li key={item.id}>
                  {item.content} - {item.reason}
                  <button onClick={() => handleApproveFlaggedContent(item.id)}>
                    Approve
                  </button>
                  <button onClick={() => handleDeleteFlaggedContent(item.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Trigger Words */}
          <div>
            <h3>Trigger Words</h3>
            <ul>
              {triggerWords.map((word) => (
                <li key={word.id}>
                  {editingTrigger === word.id ? (
                    <>
                      <input
                        type="text"
                        value={editWord}
                        onChange={(e) => setEditWord(e.target.value)}
                        placeholder="Edit word"
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Edit category"
                      />
                      <button onClick={() => handleUpdateTriggerWord(word.id)}>
                        Save
                      </button>
                      <button onClick={() => setEditingTrigger(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {word.word} - {word.category}
                      <button onClick={() => handleEditClick(word)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteTriggerWord(word.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Add Trigger Word */}
            <input
              type="text"
              value={newTriggerWord}
              onChange={(e) => setNewTriggerWord(e.target.value)}
              placeholder="New trigger word"
            />
            <input
              type="text"
              value={newTriggerCategory}
              onChange={(e) => setNewTriggerCategory(e.target.value)}
              placeholder="Category"
            />
            <button onClick={handleAddTriggerWord}>Add Trigger Word</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
