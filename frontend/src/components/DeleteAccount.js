import React, { useState } from 'react';
import { auth, firestore, storage } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';

const DeleteAccount = () => {
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    const user = auth.currentUser;

    if (user) {
      setLoading(true);
      setError('');

      try {
        // Initialize batch for Firestore deletions
        const batch = writeBatch(firestore);

        // 1. Delete user's posts
        const postsQuery = query(collection(firestore, 'Posts'), where('userId', '==', user.uid));
        const postsSnapshot = await getDocs(postsQuery);
        postsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // 2. Delete user's comments
        const commentsQuery = query(collection(firestore, 'Comments'), where('userId', '==', user.uid));
        const commentsSnapshot = await getDocs(commentsQuery);
        commentsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // 3. Commit Firestore batch deletions
        await batch.commit();

        // 4. Delete user's profile picture from Storage
        const profilePicRef = ref(storage, `profilePictures/${user.uid}`);
        await deleteObject(profilePicRef).catch((err) => {
          if (err.code !== 'storage/object-not-found') {
            throw err;
          }
        });

        // 5. Delete user document from Firestore
        const userDocRef = doc(firestore, 'Users', user.uid);
        await deleteDoc(userDocRef);

        // 6. Delete user from Firebase Auth
        await deleteUser(user).then(() => {
          navigate('/signup'); // Redirect to sign-up or landing page
        }).catch((err) => {
          setError('Failed to delete account. Please try again.');
          console.error('Error deleting user:', err);
        });

      } catch (err) {
        setError('Failed to delete account. Please try again.');
        console.error('Account deletion error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setError('No user is currently logged in.');
    }
  };

  return (
    <div className="mt-4">
      <h3>Delete Your Account</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <p>
        This action is irreversible. All your data will be permanently deleted.
        Please type <strong>DELETE</strong> to confirm.
      </p>
      <Form>
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
          block
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Form>
    </div>
  );
};

export default DeleteAccount;
