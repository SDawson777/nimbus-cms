import React, {useState} from "react";
import {useNotifications} from "../lib/notificationsContext";

export function NotificationCenter() {
  const {notifications, markAllRead, clearAll} = useNotifications();
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="nimbus-notify-root">
      <button
        className="nimbus-notify-bell"
        onClick={() => {
          setOpen((v) => !v);
          markAllRead();
        }}
        aria-label="Open notifications"
      >
        🔔
        {unread > 0 && <span className="nimbus-notify-dot">{unread}</span>}
      </button>
      {open && (
        <div className="nimbus-notify-panel">
          <div className="nimbus-notify-header">
            <span>Recent notifications</span>
            <button onClick={clearAll}>Clear all</button>
          </div>
          <div className="nimbus-notify-list">
            {notifications.length === 0 && (
              <div className="nimbus-notify-empty">You’re all caught up.</div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`nimbus-notify-item type-${n.type}`}>
                <div className="title-row">
                  <span className="title">{n.title}</span>
                  <span className="time">
                    {new Date(n.createdAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                  </span>
                </div>
                <div className="message">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
