import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { firestore } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationItem = ({ notification }) => {
  const { type, fromUserId, postId, created_at, read, id } = notification;
  const { currentUser } = useAuth();

  const renderNotificationMessage = () => {
    switch (type) {
      case 'like':
        return (
          <>
            <Link to={`/users/${fromUserId}`}>User</Link> liked your{' '}
            <Link to={`/posts/${postId}`}>post</Link>.
          </>
        );
      case 'comment':
        return (
          <>
            <Link to={`/users/${fromUserId}`}>User</Link> commented on your{' '}
            <Link to={`/posts/${postId}`}>post</Link>.
          </>
        );
      case 'follow':
        return (
          <>
            <Link to={`/users/${fromUserId}`}>User</Link> started following you.
          </>
        );
      default:
        return 'You have a new notification.';
    }
  };

  const handleMarkAsRead = async () => {
    if (!read) {
      try {
        const notificationRef = doc(
          firestore,
          'Users',
          currentUser.uid,
          'Notifications',
          id
        );
        await updateDoc(notificationRef, { read: true });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  };

  return (
    <Card 
      className={`mb-2 ${read ? '' : 'bg-light'}`} 
      onClick={handleMarkAsRead} 
      style={{ cursor: 'pointer' }}
    >
      <Card.Body>
        <Card.Text className={read ? 'fw-normal' : 'fw-bold'}>
          {renderNotificationMessage()}
        </Card.Text>
        <small className="text-muted">
          {created_at?.toDate().toLocaleString()}
        </small>
      </Card.Body>
    </Card>
  );
};

export default NotificationItem;
