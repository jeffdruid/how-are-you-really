import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  Button,
  Container,
  Card,
  Accordion,
  Row,
  Col,
  Form,
  Alert,
} from "react-bootstrap";

const AdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState([]);
  // const [expandedContentId, setExpandedContentId] = useState(null);
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
          },
        );
        setFlaggedContent(flaggedResponse.data);

        const triggerWordsResponse = await axios.get(
          "http://127.0.0.1:8000/api/triggerwords/",
          {
            headers: { Authorization: `Bearer ${currentUser.accessToken}` },
          },
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

  // Determine Firestore path
  const getFirestorePath = ({ post_id, comment_id, reply_id }) => {
    if (reply_id) {
      return `Posts/${post_id}/Comments/${comment_id}/Replies/${reply_id}`;
    } else if (comment_id) {
      return `Posts/${post_id}/Comments/${comment_id}`;
    } else {
      return `Posts/${post_id}`;
    }
  };

  // Approve flagged content
  const handleApproveFlaggedContent = async (item) => {
    try {
      const { id } = item;
      const firestorePath = getFirestorePath(item);

      // Log the Firestore path for confirmation
      console.log("Approving content with Firestore path:", firestorePath);

      // Update the visibility in the Django backend
      const response = await axios.put(
        `http://127.0.0.1:8000/api/flagged-content/${id}/`,
        { reviewed: true, is_visible: true },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("Approved flagged content:", response.data);
      setFlaggedContent(
        flaggedContent.map((item) => (item.id === id ? response.data : item)),
      );
    } catch (error) {
      console.error(
        "Error approving flagged content:",
        error.response?.data || error,
      );
    }
  };

  // Hide flagged content by setting is_visible to false
  const handleHideFlaggedContent = async (item) => {
    try {
      const { id } = item;
      const firestorePath = getFirestorePath(item);

      console.log("Hiding content with Firestore path:", firestorePath);

      // Update the visibility in the Django backend
      const response = await axios.put(
        `http://127.0.0.1:8000/api/flagged-content/${id}/`,
        { reviewed: true, is_visible: false },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      setFlaggedContent(
        flaggedContent.map((item) => (item.id === id ? response.data : item)),
      );
    } catch (error) {
      console.error(
        "Error hiding flagged content:",
        error.response?.data || error,
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
        },
      );
      setTriggerWords([...triggerWords, response.data]);
      setNewTriggerWord("");
      setNewTriggerCategory("");
    } catch (error) {
      console.error(
        "Error adding trigger word:",
        error.response?.data || error,
      );
    }
  };

  // Delete Flagged Content
  // Hide then delete flagged content
  const handleDeleteFlaggedContent = async (id, postId) => {
    try {
      // Update is_visible to false in Django and Firestore first
      await axios.put(
        `http://127.0.0.1:8000/api/flagged-content/${id}/`,
        { is_visible: false },
        {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Proceed to delete content from Django
      await axios.delete(`http://127.0.0.1:8000/api/flagged-content/${id}/`, {
        headers: { Authorization: `Bearer ${currentUser.accessToken}` },
      });

      setFlaggedContent(flaggedContent.filter((item) => item.id !== id));
    } catch (error) {
      console.error(
        "Error hiding or deleting flagged content:",
        error.response?.data || error,
      );
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
        },
      );
      setTriggerWords(
        triggerWords.map((item) => (item.id === id ? response.data : item)),
      );
      setEditingTrigger(null); // Exit edit mode
    } catch (error) {
      console.error(
        "Error updating trigger word:",
        error.response?.data || error,
      );
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center">Admin Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      {isAdmin && (
        <>
          {/* Flagged Content */}
          <Card className="mb-4">
            <Card.Header>
              <h4>Flagged Content</h4>
            </Card.Header>
            <Card.Body>
              <Accordion>
                {flaggedContent.map((item) => (
                  <Accordion.Item eventKey={item.id.toString()} key={item.id}>
                    <Accordion.Header>
                      {item.content} - {item.reason}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                          <p>
                            <strong>User:</strong> {item.user}
                          </p>
                          <p>
                            <strong>Post ID:</strong> {item.post_id}
                          </p>
                          <p>
                            <strong>Comment ID:</strong>{" "}
                            {item.comment_id || "N/A"}
                          </p>
                          <p>
                            <strong>Reply ID:</strong> {item.reply_id || "N/A"}
                          </p>
                        </Col>
                        <Col md={6}>
                          <p>
                            <strong>Reason:</strong> {item.reason}
                          </p>
                          <p>
                            <strong>Flagged At:</strong>{" "}
                            {new Date(item.flagged_at).toLocaleString()}
                          </p>
                          <p>
                            <strong>Reviewed:</strong>{" "}
                            {item.reviewed ? "Yes" : "No"}
                          </p>
                          <p>
                            <strong>Visible:</strong>{" "}
                            {item.is_visible ? "Yes" : "No"}
                          </p>
                        </Col>
                      </Row>
                      <div className="mt-3 d-flex gap-2">
                        <Button
                          variant="success"
                          onClick={() => handleApproveFlaggedContent(item)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="warning"
                          onClick={() => handleHideFlaggedContent(item)}
                        >
                          Hide
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this?",
                              )
                            ) {
                              handleDeleteFlaggedContent(item.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>

          {/* Trigger Words */}
          <Card>
            <Card.Header>
              <h4>Trigger Words</h4>
            </Card.Header>
            <Card.Body>
              <ul className="list-group list-group-flush">
                {triggerWords.map((word) => (
                  <li
                    className="list-group-item d-flex justify-content-between align-items-center"
                    key={word.id}
                  >
                    {editingTrigger === word.id ? (
                      <Form className="d-flex flex-column flex-md-row gap-2 align-items-center">
                        <Form.Control
                          type="text"
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          placeholder="Edit word"
                        />
                        <Form.Control
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          placeholder="Edit category"
                        />
                        <Button
                          variant="primary"
                          onClick={() => handleUpdateTriggerWord(word.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingTrigger(null)}
                        >
                          Cancel
                        </Button>
                      </Form>
                    ) : (
                      <>
                        <span>
                          <strong>{word.word}</strong> -{" "}
                          <em>{word.category}</em>
                        </span>
                        <div>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(word)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this?",
                                )
                              ) {
                                handleDeleteTriggerWord(word.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {/* Add Trigger Word */}
              <Form className="mt-4">
                <Form.Group className="mb-3">
                  <Form.Label>New Trigger Word</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTriggerWord}
                    onChange={(e) => setNewTriggerWord(e.target.value)}
                    placeholder="Enter trigger word"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTriggerCategory}
                    onChange={(e) => setNewTriggerCategory(e.target.value)}
                    placeholder="Enter category"
                  />
                </Form.Group>
                <Button variant="primary" onClick={handleAddTriggerWord}>
                  Add Trigger Word
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;
