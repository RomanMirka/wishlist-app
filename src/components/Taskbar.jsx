import { useLocation, useNavigate } from "react-router-dom";

export default function Taskbar({ userName, onChangeUser, onAdd }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSchedule = location.pathname === "/schedule";

  return (
    <div className="toolbar-container">
      <div className="bottom-toolbar">
        <button
          type="button"
          onClick={onAdd}
          className="primary-button add-item-button"
        >
          <span className="add-item-icon">＋</span>
          <span className="add-item-label">
            {isSchedule ? "Додати подію" : "Додати річ"}
          </span>
          <span className="add-item-label-mobile">
            {isSchedule ? "Подія" : "Додати"}
          </span>
        </button>

        <nav className="page-switch" aria-label="Розділ">
          <button
            type="button"
            aria-current={!isSchedule ? "page" : undefined}
            aria-label="Вішліст"
            title="Вішліст"
            className={`page-switch__tab ${
              !isSchedule ? "page-switch__tab--active" : ""
            }`}
            onClick={() => navigate("/wishlist")}
          >
            📋
          </button>
          <button
            type="button"
            aria-current={isSchedule ? "page" : undefined}
            aria-label="Розклад"
            title="Розклад"
            className={`page-switch__tab ${
              isSchedule ? "page-switch__tab--active" : ""
            }`}
            onClick={() => navigate("/schedule")}
          >
            📅
          </button>
        </nav>

        <button
          type="button"
          onClick={onChangeUser}
          className="user-button"
          title="Змінити ім'я"
          aria-label="Змінити ім'я"
        >
          <span className="user-avatar">
            {userName?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span className="user-name">{userName}</span>
        </button>
      </div>
    </div>
  );
}
