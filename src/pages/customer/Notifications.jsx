import { API_BASE_URL } from "../../api.js";

import React, { useEffect, useState } from "react";
import "../../styles/Notifications.css";
import CustomerNavbar from "../../components/CustomerNavbar";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load notifications"
        );
      }

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, is_read: 1 }
            : item
        )
      );
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: 1,
        }))
      );
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      setNotifications((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="notifications-loading">
          <div>
            <div className="notifications-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </>
    );
  }

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  return (
    <>
      <CustomerNavbar />

      <div className="notifications-page">
        <div className="notifications-container">

          {/* Header */}
          <div className="notifications-header">

            <div>
              <h1 className="notifications-title">
                🔔 Notifications
              </h1>

              <p className="notifications-count">
                {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="notifications-mark-all"
              >
                Mark all as read
              </button>
            )}

          </div>

          {/* Empty State */}
          {notifications.length === 0 ? (

            <div className="notifications-empty">

              <div className="notifications-empty-icon">
                🔔
              </div>

              <h2>No notifications</h2>

              <p>
                You're all caught up.
              </p>

            </div>

          ) : (

            /* Notification List */
            <div className="notifications-list">

              {notifications.map((notification) => {

                const isUnread = !notification.is_read;

                return (
                  <div
                    key={notification.id}
                    className={`notification-card ${
                      isUnread ? "unread" : ""
                    }`}
                  >

                    <div className="notification-main">

                      <div className="notification-icon">
                        {notification.type === "order"
                          ? "📦"
                          : notification.type === "verification"
                          ? "✅"
                          : notification.type === "listing"
                          ? "👕"
                          : "🔔"}
                      </div>

                      <div>

                        <p
                          className={`notification-message ${
                            isUnread ? "unread" : ""
                          }`}
                        >
                          {notification.message}
                        </p>

                        <p className="notification-date">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>

                      </div>

                    </div>

                    <div className="notification-actions">

                      {isUnread && (
                        <button
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                          className="notification-read"
                        >
                          Mark as read
                        </button>
                      )}

                      <button
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                        className="notification-delete"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Notifications;