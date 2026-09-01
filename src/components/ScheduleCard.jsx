import { getDisplayName, getOwnerTheme } from "../lib/userTheme";

const TYPE_LABELS = {
  lecture: "Лекція",
  practice: "Практика",
  remote: "Дистанційне",
  other: "Інше",
};

const TYPE_COLOR_VARS = {
  lecture: "var(--type-lecture)",
  practice: "var(--type-practice)",
  remote: "var(--type-remote)",
  other: "var(--type-other)",
};

export default function ScheduleCard({
  item,
  currentTime,
  isCompact,
  onDelete,
  onEdit,
}) {
  const nowMin = parseTimeToMin(currentTime);
  const startMin = parseTimeToMin(item.startTime);
  let endMin = parseTimeToMin(item.endTime);

  // Обробка переходів через північ (напр. 23:00 - 01:00)
  if (endMin <= startMin) endMin += 1440;
  const adjNow = nowMin < startMin && endMin > 1440 ? nowMin + 1440 : nowMin;
  const isHappeningNow = adjNow >= startMin && adjNow <= endMin;

  const rawDurationMinutes = endMin - startMin;
  const durationLabel = formatDuration(rawDurationMinutes);

  // Легка часова ієрархія без великих порожніх блоків у звичайному списку.
  const durationMinutes = Math.max(15, rawDurationMinutes);
  const calculatedMinHeight = Math.min(
    isCompact ? 150 : 170,
    Math.max(isCompact ? 112 : 124, Math.round(durationMinutes * 0.75)),
  );

  const typeColor = TYPE_COLOR_VARS[item.type] || TYPE_COLOR_VARS.other;
  const owner = getDisplayName(item.owner);
  const ownerTheme = getOwnerTheme(item.owner);

  function handleDeleteClick() {
    if (confirm(`Видалити «${item.title}» з розкладу?`)) {
      onDelete(item.id);
    }
  }

  return (
    <article
      className={`schedule-card ${isHappeningNow ? "schedule-card--now" : ""} ${
        isCompact ? "schedule-card--compact" : ""
      }`}
      style={{
        minHeight: `${calculatedMinHeight}px`,
        "--schedule-type-color": typeColor,
        "--schedule-owner-color": ownerTheme.color,
        "--schedule-owner-ink": ownerTheme.ink,
      }}
    >
      <div className="schedule-card__stripe" aria-hidden="true" />

      <div className="schedule-card__body">
        <div className="schedule-card__header">
          <h3 className="schedule-card__title" title={item.title}>
            {isHappeningNow && (
              <span className="schedule-card__live-dot" aria-hidden="true" />
            )}
            {item.title}
          </h3>

          <div className="schedule-card__header-actions">
            <button
              type="button"
              className="dialog-icon-button"
              onClick={() => onEdit(item)}
              title="Редагувати"
              aria-label={`Редагувати ${item.title}`}
            >
              <svg
                className="action-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5z" />
                <path d="m13.8 6.7 3.5 3.5" />
              </svg>
            </button>
            <button
              type="button"
              className="dialog-icon-button dialog-icon-button--close"
              onClick={() => handleDeleteClick()}
              title="Видалити"
              aria-label={`Видалити ${item.title}`}
            >
              <svg
                className="action-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m5 5 14 14M19 5 5 19" />
              </svg>
            </button>
          </div>
        </div>

        <div className="schedule-card__content">
          <div className="schedule-card__time-row">
            <span className="schedule-card__time-group">
              <span className="schedule-card__time">
                {item.startTime}–{item.endTime}
              </span>
              <span className="schedule-card__duration">{durationLabel}</span>
            </span>
            <span className="schedule-owner-badge" title={`Створив/-ла: ${owner}`}>
              {owner}
            </span>
          </div>

          <div className="schedule-card__meta-row">
            <span className="schedule-card__type">
              <span className="schedule-card__type-dot" aria-hidden="true" />
              {TYPE_LABELS[item.type] || "Пара"}
            </span>
            {item.location && (
              <span className="schedule-card__location" title={item.location}>
                📍 {item.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function parseTimeToMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}хв`;
  if (mins === 0) return `${hours}год`;
  return `${hours}год ${mins}хв`;
}
