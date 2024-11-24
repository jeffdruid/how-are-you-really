import React, { useState } from "react";
import { auth, firestore, storage } from "../firebase";
import { updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

const DeleteAccount = () => {
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setError("No user is currently logged in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Set profile to default
      const defaultProfilePic = await getDownloadURL(
        ref(storage, "default_profile.jpg"),
      );

      await updateDoc(doc(firestore, "Users", user.uid), {
        username: "Deleted Profile",
        profilePicUrl: defaultProfilePic,
        email: null, // Remove email
        updated_at: new Date(),
      });

      await updateProfile(user, {
        displayName: "Deleted Profile",
        photoURL: defaultProfilePic,
      });

      // Step 2: Logout user
      await auth.signOut();

      // Step 3: Delete user from Firebase Authentication
      await deleteUser(user);

      // Step 4: Redirect to GoodbyePage
      navigate("/goodbye");
    } catch (err) {
      console.error("Error deleting account:", err);
      setError("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3>Delete Your Account</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <p>
        This action will anonymize your profile. All your posts and comments
        will remain but will be attributed to a "Deleted Profile." Please type{" "}
        <strong>DELETE</strong> to confirm.
      </p>
      <Form onSubmit={(e) => e.preventDefault()}>
        <Form.Group controlId="confirmDelete">
          <Form.Control
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
        </Form.Group>
        <Button
          className="mt-3"
          variant="danger"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? "Processing..." : "Delete Account"}
        </Button>
      </Form>
    </div>
  );
};

export default DeleteAccount;
