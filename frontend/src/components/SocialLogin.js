import React, { useState } from "react";
import { auth, googleProvider, firestore } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { firebaseErrorMessages } from "../utils/firebaseErrors";
import { FaGoogle } from "react-icons/fa";
import { Button, Spinner, Alert } from "react-bootstrap";

const SocialLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Initialize loading state

  const handleSocialLogin = async (provider) => {
    setLoading(true); // Start loading
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(firestore, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If user document doesn't exist, create one
        await setDoc(userDocRef, {
          username: user.displayName || "",
          email: user.email,
          bio: "",
          emailVerified: user.emailVerified,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      navigate("/"); // Redirect to Home after successful login
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage);
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="d-flex justify-content-center gap-3">
        {/* Google Sign-In */}
        <Button
          variant="primary"
          onClick={() => handleSocialLogin(googleProvider)}
          disabled={loading} // Disable button during loading
          className="d-flex align-items-center"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Signing in...
            </>
          ) : (
            <>
              <FaGoogle className="me-2" />
              Sign in with Google
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SocialLogin;
