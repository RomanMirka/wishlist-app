import { useEffect, useState } from "react";
import { getUserThemeClass } from "../lib/userTheme";

// Bump this key (e.g. to "_v2") whenever you want the notice to reappear
// after a future update.
const UPDATE_SEEN_KEY = "schedule_update_seen_v2";

export default function UpdateNotice() {
  const [visible, setVisible] = useState(false);
  const [userThemeClass] = useState(() => {
    try {
      return getUserThemeClass(localStorage.getItem("wishlist_user_name"));
    } catch {
      return "";
    }
  });

  // The theme variables (--ink, --accent, --surface, ...) live under the
  // .theme-day / .theme-night classes. Pages apply that class on their own
  // wrapper, but this component renders at the app root (outside any page),
  // so it needs to pick and apply the theme itself to look right anywhere.
  const [isNight] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 7;
  });

  useEffect(() => {
    try {
      if (!localStorage.getItem(UPDATE_SEEN_KEY)) {
        setVisible(true);
      }
    } catch {
      // Якщо localStorage недоступний — просто не показуємо, щоб не набридати.
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  function dismiss() {
    try {
      localStorage.setItem(UPDATE_SEEN_KEY, "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={`name-gate ${isNight ? "theme-night" : "theme-day"} ${userThemeClass}`}
      role="presentation"
    >
      <div
        className="name-gate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-notice-title"
      >
        <div className="dialog-titlebar">
          <span id="update-notice-title" className="dialog-title">
            Що нового
          </span>
          <button
            type="button"
            className="dialog-icon-button dialog-icon-button--close"
            onClick={dismiss}
            title="Закрити"
          >
            ✕
          </button>
        </div>

        <div className="dialog-content">
          <p className="dialog-description">
            <strong>Розклад: </strong>тепер зручніше редагувати і дизайн
            трооошки краще.
          </p>

          <button
            type="button"
            className="primary-button name-gate-button"
            onClick={dismiss}
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
