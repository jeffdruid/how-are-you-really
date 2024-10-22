import React, { useState, useEffect, useCallback } from 'react';
import { firestore } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, writeBatch, limit, startAfter } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem from './NotificationItem';
import { Spinner, Alert, Button, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';

const NotificationsList = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const NOTIFICATIONS_LIMIT = 10;

  // Memoized fetchNotifications function to avoid re-creating it on every render
  const fetchNotifications = useCallback(
    (loadMore = false) => {
      if (!currentUser || (!loadMore && notifications.length > 0)) return; // Prevent re-fetching on every render
      setLoading(true);

      const notificationsRef = collection(firestore, 'Users', currentUser.uid, 'Notifications');
      let notificationsQuery = query(
        notificationsRef,
        orderBy('created_at', 'desc'),
        limit(NOTIFICATIONS_LIMIT)
      );

      if (loadMore && lastVisible) {
        notificationsQuery = query(
          notificationsRef,
          orderBy('created_at', 'desc'),
          startAfter(lastVisible),
          limit(NOTIFICATIONS_LIMIT)
        );
      }

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const notificationsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          if (snapshot.docs.length < NOTIFICATIONS_LIMIT) {
            setHasMore(false);
          }

          setNotifications((prev) => (loadMore ? [...prev, ...notificationsData] : notificationsData));
          setLastVisible(lastDoc);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          setError('Failed to load notifications.');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    },
    [currentUser, lastVisible, notifications.length]
  );

  useEffect(() => {
    fetchNotifications(false); // Only load initial notifications when the component mounts
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(firestore);
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
    setHasMore(true);
    setLastVisible(null);
    setNotifications([]);
  };

  // Infinite scroll event handler
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight && !loading && hasMore) {
      fetchNotifications(true);
    }
  }, [loading, hasMore, fetchNotifications]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading && notifications.length === 0) {
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

        {notifications.some((n) => !n.read) && filter === 'all' && (
          <Button variant="link" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        // 
        notifications.map((notification, index) => (
          <NotificationItem key={`${notification.id}-${index}`} notification={notification} />
        ) )
      )}

      {loading && <Spinner animation="border" />}
    </div>
  );
};

export default NotificationsList;
