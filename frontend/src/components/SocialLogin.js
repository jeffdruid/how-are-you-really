// src/components/SocialLogin.js

import React, { useState } from 'react';
import { auth, googleProvider, firestore } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { firebaseErrorMessages } from '../utils/firebaseErrors';
import { FaGoogle } from 'react-icons/fa'; 

const SocialLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Initialize loading state

  const handleSocialLogin = async (provider) => {
    setLoading(true); // Start loading
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(firestore, 'Users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If user document doesn't exist, create one
        await setDoc(userDocRef, {
          username: user.displayName || '',
          email: user.email,
          bio: '',
          emailVerified: user.emailVerified,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      navigate('/'); // Redirect to Home after successful login
    } catch (err) {
      const friendlyMessage = firebaseErrorMessages(err.code);
      setError(friendlyMessage);
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div>
      <h3>Or sign in with:</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {/* Google Sign-In */}
        <button
          onClick={() => handleSocialLogin(googleProvider)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            border: 'none',
            borderRadius: '5px',
            backgroundColor: '#4285F4',
            color: '#fff',
            cursor: 'pointer',
          }}
          disabled={loading} // Disable button during loading
        >
          {loading ? 'Signing in...' : <>
            <FaGoogle style={{ marginRight: '5px' }} />
            Google
          </>}
        </button>
      </div>
    </div>
  );
};

export default SocialLogin;
