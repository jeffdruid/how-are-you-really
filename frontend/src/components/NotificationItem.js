import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import { firestore } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BsHeart, BsChat, BsPersonPlus, BsTrash } from 'react-icons/bs'; // Import icons

const NotificationItem = ({ notification }) => {
  const { type, postId, created_at, read, id, fromUserId } = notification;
  const { currentUser } = useAuth();

  const renderNotificationMessage = () => {
    switch (type) {
      case 'like':
        return (
          <>
            <BsHeart className="me-1 text-danger" /> Someone liked your{' '}
            <Link to={`/posts/${postId}`} className="text-decoration-none">
              post
            </Link>.
          </>
        );
      case 'comment':
        return (
          <>
            <BsChat className="me-1 text-primary" /> Someone commented on your{' '}
            <Link to={`/posts/${postId}`} className="text-decoration-none">
              post
            </Link>.
          </>
        );
      case 'follow':
        return (
          <>
            <BsPersonPlus className="me-1 text-success" /> Someone started
            following you.{' '}
            <Link to={`/users/${fromUserId}`} className="text-decoration-none">
              View profile
            </Link>.
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

  const handleDeleteNotification = async (e) => {
    e.stopPropagation();
    try {
      const notificationRef = doc(
        firestore,
        'Users',
        currentUser.uid,
        'Notifications',
        id
      );
      await deleteDoc(notificationRef);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <Card
      className={`mb-2 shadow-sm ${read ? 'border-light' : 'border-info'}`}
      onClick={handleMarkAsRead}
      style={{
        cursor: 'pointer',
        borderLeft: read ? 'none' : '3px solid #007bff',
      }}
    >
      <Card.Body className="d-flex justify-content-between align-items-center">
        <div>
          <Card.Text
            className={`mb-1 ${read ? 'text-muted' : 'fw-bold text-dark'}`}
          >
            {renderNotificationMessage()}
          </Card.Text>
          <small className="text-muted">
            {created_at?.toDate().toLocaleString()}
          </small>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={handleDeleteNotification}
          className="text-danger p-0"
          title="Delete notification"
        >
          <BsTrash />
        </Button>
      </Card.Body>
    </Card>
  );
};

export default NotificationItem;
