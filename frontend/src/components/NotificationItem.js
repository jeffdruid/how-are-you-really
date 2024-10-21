import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

const NotificationItem = ({ notification }) => {
  const { type, fromUserId, postId, created_at, read } = notification;

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

  return (
    <Card className={`mb-2 ${read ? '' : 'bg-light'}`}>
      <Card.Body>
        <Card.Text>{renderNotificationMessage()}</Card.Text>
        <small className="text-muted">
          {created_at?.toDate().toLocaleString()}
        </small>
      </Card.Body>
    </Card>
  );
};

export default NotificationItem;
