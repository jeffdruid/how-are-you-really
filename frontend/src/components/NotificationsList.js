import React, { useState, useEffect, useCallback } from "react";
import { firestore } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  writeBatch,
  limit,
  startAfter,
  where,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import NotificationItem from "./NotificationItem";
import {
  Spinner,
  Alert,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "react-bootstrap";

const NotificationsList = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const NOTIFICATIONS_LIMIT = 10;

  // Memoized fetchNotifications function to avoid re-creating it on every render
  const fetchNotifications = useCallback(
    (loadMore = false) => {
      if (!currentUser || (!loadMore && notifications.length > 0)) return;
      setLoading(true);

      const notificationsRef = collection(
        firestore,
        "Users",
        currentUser.uid,
        "Notifications",
      );
      let notificationsQuery;

      // Filter notifications based on the selected filter
      if (filter === "unread") {
        notificationsQuery = query(
          notificationsRef,
          where("read", "==", false),
          orderBy("created_at", "desc"),
          limit(NOTIFICATIONS_LIMIT),
        );
      } else {
        notificationsQuery = query(
          notificationsRef,
          orderBy("created_at", "desc"),
          limit(NOTIFICATIONS_LIMIT),
        );
      }

      if (loadMore && lastVisible) {
        notificationsQuery = query(
          notificationsRef,
          orderBy("created_at", "desc"),
          startAfter(lastVisible),
          limit(NOTIFICATIONS_LIMIT),
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

          setNotifications((prev) =>
            loadMore ? [...prev, ...notificationsData] : notificationsData,
          );
          setLastVisible(lastDoc);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setError("Failed to load notifications.");
          setLoading(false);
        },
      );

      return () => unsubscribe();
    },
    [currentUser, lastVisible, filter, notifications.length],
  );

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications, filter]);

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(firestore);
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(
            firestore,
            "Users",
            currentUser.uid,
            "Notifications",
            notification.id,
          );
          batch.update(notificationRef, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      setError("Failed to mark notifications as read.");
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
    if (
      window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight &&
      !loading &&
      hasMore
    ) {
      fetchNotifications(true);
    }
  }, [loading, hasMore, fetchNotifications]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="notifications-list-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ToggleButtonGroup
          type="radio"
          name="filter"
          value={filter}
          onChange={handleFilterChange}
        >
          <ToggleButton
            id="tbg-radio-1"
            value="all"
            variant="outline-dark"
            size="sm"
          >
            All
          </ToggleButton>
          <ToggleButton
            id="tbg-radio-2"
            value="unread"
            variant="outline-dark"
            size="sm"
          >
            Unread
          </ToggleButton>
        </ToggleButtonGroup>

        {notifications.some((n) => !n.read) && filter === "all" && (
          <Button
            variant="link"
            onClick={markAllAsRead}
            className="text-decoration-none text-primary"
            size="sm"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {notifications.length === 0 && !loading ? (
        <p className="text-center text-muted">No notifications.</p>
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))
      )}

      {loading && (
        <div className="text-center mt-3">
          <Spinner animation="border" />
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
