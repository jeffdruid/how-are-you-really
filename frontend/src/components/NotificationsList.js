import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem from './NotificationItem';
import { Spinner, Alert, Button } from 'react-bootstrap';

const NotificationsList = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(firestore, 'Users', currentUser.uid, 'Notifications');
    const notificationsQuery = query(notificationsRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const markAllAsRead = async () => {
    try {
      const batch = firestore.batch();
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(
            firestore,
            'Users',
            currentUser.uid,
            'Notifications',
            notification.id
          );
          batch.update(notificationRef, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (notifications.length === 0) {
    return <p>No notifications.</p>;
  }

  return (
    <div>
      <Button variant="link" onClick={markAllAsRead}>
        Mark all as read
      </Button>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationsList;
