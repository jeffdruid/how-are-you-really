import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../utils/validateEmail';
import { validatePassword } from '../utils/validatePassword';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');
//   const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    let valid = true;

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Create a user document in Firestore
      await setDoc(doc(firestore, 'Users', user.uid), {
        username,
        email,
        bio: '',
        emailVerified: user.emailVerified, // Store verification status
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Inform the user to verify their email
      setMessage('Registration successful! Please check your email to verify your account.');
      setError('');
      
      // Optionally, redirect to a "Verify Your Email" page
      // navigate('/verify-email');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        {emailError && <p style={{ color: 'red' }}>{emailError}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
