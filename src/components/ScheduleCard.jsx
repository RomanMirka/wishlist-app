const TYPE_LABELS = {
  lecture: "Лекція",
  practice: "Практика",
  other: "Інше",
};

const TYPE_COLOR_VARS = {
  lecture: "var(--type-lecture)",
  practice: "var(--type-practice)",
  other: "var(--type-other)",
};

export default function ScheduleCard({
  item,
  currentUser,
  currentTime,
  isCompact,
  onDelete,
}) {
  const isMine = item.owner === currentUser;

  const nowMin = parseTimeToMin(currentTime);
  const startMin = parseTimeToMin(item.startTime);
  let endMin = parseTimeToMin(item.endTime);

  // Обробка переходів через північ (напр. 23:00 - 01:00)
  if (endMin <= startMin) endMin += 1440;
  const adjNow = nowMin < startMin && endMin > 1440 ? nowMin + 1440 : nowMin;
  const isHappeningNow = adjNow >= startMin && adjNow <= endMin;

  // Динамічна висота картки (1 хв = 2.5px, мінімум 85px)
  const durationMinutes = Math.max(15, endMin - startMin);
  const calculatedMinHeight = Math.min(
    350,
    Math.max(85, Math.round(durationMinutes * 2.5)),
  );

  const typeColor = TYPE_COLOR_VARS[item.type] || TYPE_COLOR_VARS.other;

  return (
    <article
      className={`schedule-card ${isHappeningNow ? "schedule-card--now" : ""} ${
        isCompact ? "schedule-card--compact" : ""
      }`}
      style={{
        minHeight: `${calculatedMinHeight}px`,
        "--schedule-type-color": typeColor,
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

          <button
            type="button"
            className="dialog-icon-button dialog-icon-button--close"
            style={
              isCompact
                ? { width: "1.35rem", height: "1.35rem", fontSize: "9px" }
                : {}
            }
            onClick={() => onDelete(item.id)}
            title="Видалити"
            aria-label={`Видалити ${item.title}`}
          >
            ✕
          </button>
        </div>

        <div className="schedule-card__content">
          <div className="schedule-card__time-row">
            <span className="schedule-card__time">
              {item.startTime}–{item.endTime}
            </span>
            <span
              className={`schedule-owner-badge ${
                isMine
                  ? "schedule-owner-badge--mine"
                  : "schedule-owner-badge--partner"
              }`}
            >
              {isMine ? "Я" : "Вона"}
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
