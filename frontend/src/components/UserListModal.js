import React, { useState, useEffect } from "react";
import { Modal, ListGroup, Image, Spinner } from "react-bootstrap";
import { firestore } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const UserListModal = ({ show, handleClose, userId, type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          let q;
          if (type === "followers") {
            q = query(
              collection(firestore, "Follows"),
              where("followingId", "==", userId),
            );
          } else {
            q = query(
              collection(firestore, "Follows"),
              where("followerId", "==", userId),
            );
          }
          const snapshot = await getDocs(q);
          const userIds = snapshot.docs.map((doc) => {
            const data = doc.data();
            return type === "followers" ? data.followerId : data.followingId;
          });

          if (userIds.length === 0) {
            setUsers([]);
          } else {
            // Fetch user details
            const userPromises = userIds.map((id) =>
              getDoc(doc(firestore, "Users", id)),
            );
            const userDocs = await Promise.all(userPromises);
            const usersData = userDocs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setUsers(usersData);
          }
        } catch (err) {
          console.error("Error fetching user list:", err);
          setError("An error occurred while fetching the user list.");
        } finally {
          setLoading(false); // End loading
        }
      };

      fetchUsers();
    } else {
      setUsers([]);
      setError("");
    }
  }, [show, userId, type]);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {type === "followers" ? "Followers" : "Following"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : users.length === 0 ? (
          <p>No {type} found.</p>
        ) : (
          <ListGroup variant="flush">
            {users.map((user) => (
              <ListGroup.Item
                key={user.id}
                className="d-flex align-items-center"
              >
                <Image
                  src={user.profilePicUrl || "/default_profile.jpg"}
                  roundedCircle
                  width={40}
                  height={40}
                  className="me-3"
                  loading="lazy"
                />
                <Link to={`/users/${user.id}`}>
                  {user.username || "Anonymous"}
                </Link>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UserListModal;
