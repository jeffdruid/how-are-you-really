import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationItem = ({ notification }) => {
  const { type, postId, created_at, read, id, fromUserId } = notification; // Ensure fromUserId is available for 'follow'
  const { currentUser } = useAuth();

  const renderNotificationMessage = () => {
    switch (type) {
      case 'like':
        return <>Someone liked your <Link to={`/posts/${postId}`}>post</Link>.</>;
      case 'comment':
        return <>Someone commented on your <Link to={`/posts/${postId}`}>post</Link>.</>;
      case 'follow':
        return <>Someone started following you. <Link to={`/users/${fromUserId}`}>View profile</Link>.</>;
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

  const handleDeleteNotification = async () => {
    try {
      const notificationRef = doc(firestore, 'Users', currentUser.uid, 'Notifications', id);
      await deleteDoc(notificationRef);
      console.log('Notification deleted:', id);
    } catch (err) {
      console.error('Error deleting notification:', err);
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
        <div className="mt-2 d-flex justify-content-between">
          <Button 
            variant="danger" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering mark as read when deleting
              handleDeleteNotification();
            }}
          >
            Delete
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default NotificationItem;
