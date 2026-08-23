export default function Taskbar({ userName, onChangeUser, onAdd }) {

  return (
    <div className="toolbar-container">
      <div className="bottom-toolbar">
        <button
          type="button"
          onClick={onAdd}
          className="primary-button add-item-button"
        >
          <span className="add-item-icon">＋</span>
          <span className="add-item-label">Додати річ</span>
          <span className="add-item-label-mobile">Додати</span>
        </button>

        <button
          type="button"
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
