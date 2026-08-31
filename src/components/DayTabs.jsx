const DAYS = [
  { id: "monday", label: "Пн" },
  { id: "tuesday", label: "Вт" },
  { id: "wednesday", label: "Ср" },
  { id: "thursday", label: "Чт" },
  { id: "friday", label: "Пт" },
  { id: "saturday", label: "Сб" },
];

export default function DayTabs({ activeDay, onSelectDay, eventDays }) {
  return (
    <div className="filter-buttons" role="tablist">
      {DAYS.map((day) => (
        <button
          key={day.id}
          type="button"
          role="tab"
          aria-selected={activeDay === day.id}
          className={`filter-button ${
            activeDay === day.id ? "filter-button--active" : ""
          }`}
          onClick={() => onSelectDay(day.id)}
        >
          {day.label}
          {eventDays?.has(day.id) && (
            <span className="day-tab-dot" aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}
