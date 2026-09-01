import { useEffect, useState } from "react";

const MAX_TITLE_LENGTH = 25;
const MAX_LOCATION_LENGTH = 20;

function toForm(item) {
  return {
    title: item.title ?? "",
    day: item.day ?? "monday",
    startTime: item.startTime ?? "08:30",
    endTime: item.endTime ?? "10:05",
    location: item.location ?? "",
    type: item.type ?? "lecture",
  };
}

const INITIAL_STATE = {
  title: "",
  day: "monday",
  startTime: "08:30",
  endTime: "10:05",
  location: "",
  type: "lecture",
};

export default function AddScheduleModal({
  onClose,
  onSave,
  currentUser,
  defaultDay,
  initialItem,
  title = "Нова подія розкладу",
  submitLabel = "Зберегти",
}) {
  const [form, setForm] = useState(() =>
    initialItem
      ? toForm(initialItem)
      : { ...INITIAL_STATE, day: defaultDay || "monday" },
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  useEffect(() => {
    setForm(
      initialItem
        ? toForm(initialItem)
        : { ...INITIAL_STATE, day: defaultDay || "monday" },
    );
    setError("");
  }, [initialItem, defaultDay]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanTitle = form.title.trim();
    const cleanLocation = form.location.trim();

    if (!cleanTitle) {
      setError("Вкажіть назву події або пари");
      return;
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      setError(`Назва занадто довга (макс. ${MAX_TITLE_LENGTH} симв.)`);
      return;
    }

    if (cleanLocation.length > MAX_LOCATION_LENGTH) {
      setError(`Локація занадто довга (макс. ${MAX_LOCATION_LENGTH} симв.)`);
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("Вкажіть час початку та кінця");
      return;
    }

    if (form.startTime === form.endTime) {
      setError("Час початку не може співпадати з часом кінця");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        title: cleanTitle,
        location: cleanLocation,
        owner: currentUser,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        "Не вдалося зберегти. Перевірте інтернет-з'єднання та спробуйте ще раз.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-item-modal" role="presentation">
      <div className="add-item-dialog" role="dialog" aria-modal="true">
        <div className="dialog-titlebar">
          <span className="dialog-title">{title}</span>
          <button
            type="button"
            className="dialog-icon-button dialog-icon-button--close"
            onClick={onClose}
            title="Закрити"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          <div className="form-fields">
            <label className="form-field">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="field-label">Назва події / пари *</span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>
                  {form.title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
              <input
                autoFocus
                maxLength={MAX_TITLE_LENGTH}
                value={form.title}
                onChange={updateField("title")}
                placeholder="напр. Комп'ютерні сист."
                className="form-input"
              />
            </label>

            <div className="form-row">
              <label className="form-field">
                <span className="field-label">День тижня</span>
                <select
                  value={form.day}
                  onChange={updateField("day")}
                  className="form-input"
                >
                  <option value="monday">Понеділок</option>
                  <option value="tuesday">Вівторок</option>
                  <option value="wednesday">Середа</option>
                  <option value="thursday">Четвер</option>
                  <option value="friday">П'ятниця</option>
                  <option value="saturday">Субота</option>
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">Тип</span>
                <select
                  value={form.type}
                  onChange={updateField("type")}
                  className="form-input"
                >
                  <option value="lecture">Лекція</option>
                  <option value="practice">Практика</option>
                  <option value="remote">Дистанційне</option>
                  <option value="other">Інше</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span className="field-label">Початок</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={updateField("startTime")}
                  className="form-input"
                  required
                />
              </label>
              <label className="form-field">
                <span className="field-label">Кінець</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={updateField("endTime")}
                  className="form-input"
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="field-label">Аудиторія / Посилання</span>
                <span style={{ fontSize: "10px", opacity: 0.6 }}>
                  {form.location.length}/{MAX_LOCATION_LENGTH}
                </span>
              </div>
              <input
                maxLength={MAX_LOCATION_LENGTH}
                value={form.location}
                onChange={updateField("location")}
                placeholder="напр. ауд. 204"
                className="form-input"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button"
              disabled={isSaving}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="primary-button save-item-button"
              disabled={isSaving}
            >
              {isSaving ? "Зберігаю…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
