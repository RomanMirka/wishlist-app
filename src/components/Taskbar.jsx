import { useEffect, useState } from "react";

export default function Taskbar({ count, userName, onChangeUser, onAdd }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="toolbar-container">
      <div className="bottom-toolbar">
        <button
          onClick={onAdd}
          className="primary-button add-item-button"
        >
          <span className="add-item-icon">＋</span>
          <span className="add-item-label">Додати річ</span>
          <span className="add-item-label-mobile">Додати</span>
        </button>

        <button
          onClick={onChangeUser}
          className="user-button"
          title="Змінити ім'я"
        >
          <span className="user-avatar">
            {userName?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span className="user-name">
            {userName}
          </span>
        </button>
      </div>
    </div>
  );
}
