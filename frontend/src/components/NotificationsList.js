import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem from './NotificationItem';
import { Spinner, Alert, Button, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';

const NotificationsList = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false); // Track unread status

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(firestore, 'Users', currentUser.uid, 'Notifications');
    let notificationsQuery = query(notificationsRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        let notificationsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Check if there are any unread notifications
        const unreadNotifications = notificationsData.filter(notification => !notification.read);
        setHasUnreadNotifications(unreadNotifications.length > 0);

        if (filter === 'unread') {
          notificationsData = unreadNotifications;
        }

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
  }, [currentUser, filter]);

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(firestore); // Correct batch initialization
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
      setError('Failed to mark notifications as read.');
    }
  };

  const handleFilterChange = (val) => {
    setFilter(val);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ToggleButtonGroup 
          type="radio" 
          name="filter" 
          value={filter} 
          onChange={handleFilterChange}
        >
          <ToggleButton id="tbg-radio-1" value="all" variant="outline-primary">
            All
          </ToggleButton>
          <ToggleButton id="tbg-radio-2" value="unread" variant="outline-primary">
            Unread
          </ToggleButton>
        </ToggleButtonGroup>

        {hasUnreadNotifications && filter === 'all' && (
          <Button variant="link" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))
      )}
    </div>
  );
};

export default NotificationsList;
