import { useCallback, useEffect, useMemo, useState } from "react";
import Taskbar from "../components/Taskbar";
import CatCompanion from "../components/CatCompanion";
import AddScheduleModal from "../components/AddScheduleModal";
import DayTabs from "../components/DayTabs";
import ScheduleCard from "../components/ScheduleCard";
import NameGate from "../components/NameGate";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  fetchScheduleItems,
  insertScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  subscribeToScheduleChanges,
} from "../lib/scheduleService";
import { getUserThemeClass } from "../lib/userTheme";

const STORAGE_KEY = "wishlist_user_name";
const SCHEDULE_STORAGE_KEY = "user_schedule_events";

const DAYS_MAP = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function Schedule() {
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const [activeDay, setActiveDay] = useState(() => {
    const currentDayIndex = new Date().getDay();
    const day = DAYS_MAP[currentDayIndex];
    return day === "sunday" ? "monday" : day;
  });

  const [userFilter, setUserFilter] = useState("all");
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showNameGate, setShowNameGate] = useState(false);
  const [isNight, setIsNight] = useState(() => isNightTime());
  const [currentTime, setCurrentTime] = useState(() => getCurrentTimeString());

  const [scheduleItems, setScheduleItems] = useState(() => {
    if (isSupabaseConfigured) return [];
    try {
      return JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  // --- Supabase: initial load ------------------------------------------------
  const loadSchedule = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const items = await fetchScheduleItems();
      setScheduleItems(items);
    } catch (err) {
      console.error(err);
      setLoadError(
        "Не вдалося завантажити розклад. Перевірте інтернет-з'єднання.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // --- Supabase: realtime sync between devices --------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const unsubscribe = subscribeToScheduleChanges({
      onInsert: (item) => {
        setScheduleItems((prev) =>
          prev.some((existing) => existing.id === item.id)
            ? prev
            : [...prev, item],
        );
      },
      onDelete: (id) => {
        setScheduleItems((prev) => prev.filter((item) => item.id !== id));
      },
      onUpdate: (item) => {
        setScheduleItems((prev) =>
          prev.map((existing) => (existing.id === item.id ? item : existing)),
        );
      },
    });

    return unsubscribe;
  }, []);

  // --- localStorage fallback (only when Supabase isn't configured) -----------
  useEffect(() => {
    if (isSupabaseConfigured) return;
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduleItems));
    } catch {}
  }, [scheduleItems]);

  useEffect(() => {
    const updateTimeAndTheme = () => {
      setIsNight(isNightTime());
      setCurrentTime(getCurrentTimeString());
    };
    const id = setInterval(updateTimeAndTheme, 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("app-theme-night", isNight);
    document.documentElement.classList.toggle("app-theme-day", !isNight);
    document.body.classList.toggle("app-theme-night", isNight);
    document.body.classList.toggle("app-theme-day", !isNight);

    return () => {
      document.documentElement.classList.remove(
        "app-theme-day",
        "app-theme-night",
      );
      document.body.classList.remove("app-theme-day", "app-theme-night");
    };
  }, [isNight]);

  // handleSaveSchedule is awaited by AddScheduleModal, which shows its own
  // error state if this throws — so we let Supabase errors bubble up.
  async function handleSaveSchedule(newItem) {
    if (!isSupabaseConfigured) {
      setScheduleItems((prev) => [
        ...prev,
        { ...newItem, id: `${Date.now()}-${Math.random()}` },
      ]);
      return;
    }

    const saved = await insertScheduleItem(newItem);
    setScheduleItems((prev) =>
      prev.some((item) => item.id === saved.id) ? prev : [...prev, saved],
    );
  }

  async function handleUpdateSchedule(form) {
    if (!editingItem) return;

    if (!isSupabaseConfigured) {
      setScheduleItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...form, id: editingItem.id } : item,
        ),
      );
      return;
    }

    const updated = await updateScheduleItem(editingItem.id, form);
    setScheduleItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleDeleteSchedule(id) {
    const removed = scheduleItems.find((item) => item.id === id);
    setScheduleItems((prev) => prev.filter((item) => item.id !== id));

    if (!isSupabaseConfigured) return;

    try {
      await deleteScheduleItem(id);
    } catch (err) {
      console.error(err);
      setActionError("Не вдалося видалити подію. Спробуйте ще раз.");
      if (removed) {
        setScheduleItems((prev) =>
          prev.some((item) => item.id === id) ? prev : [...prev, removed],
        );
      }
    }
  }

  function saveUserName(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {}
    setUserName(name);
    setShowNameGate(false);
  }

  const effectiveUser = userName || "Я";

  // Ім'я партнера/партнерки підтягується з розкладу: щойно з'являється подія
  // з іншим власником, її ім'я "резервується" і замінює підпис "Вона".
  const partnerName = useMemo(() => {
    const partnerEvent = scheduleItems.find(
      (item) => item.owner && item.owner !== effectiveUser,
    );
    return partnerEvent ? partnerEvent.owner : "Партнер(ка)";
  }, [scheduleItems, effectiveUser]);

  // Дні, у яких вже є хоч одна пара — для крапки-індикатора на вкладках
  const eventDays = useMemo(
    () => new Set(scheduleItems.map((item) => item.day)),
    [scheduleItems],
  );

  // Статус у реальному часі (з обробкою переходу через північ)
  const statusInfo = useMemo(() => {
    const todayId = DAYS_MAP[new Date().getDay()];
    const todayEvents = scheduleItems.filter((item) => item.day === todayId);
    const nowMin = timeToMinutes(currentTime);

    const getStatusForUser = (isCurrentUser) => {
      const userEvents = todayEvents.filter((item) =>
        isCurrentUser
          ? item.owner === effectiveUser
          : item.owner !== effectiveUser,
      );

      const currentEvent = userEvents.find((e) => {
        const start = timeToMinutes(e.startTime);
        let end = timeToMinutes(e.endTime);
        if (end <= start) end += 1440; // Перехід через північ
        const adjNow = nowMin < start && end > 1440 ? nowMin + 1440 : nowMin;
        return adjNow >= start && adjNow <= end;
      });

      if (currentEvent) {
        return {
          busy: true,
          text: `На парі: ${truncate(currentEvent.title, 12)} (до ${currentEvent.endTime})`,
        };
      }

      const nextEvent = userEvents
        .filter((e) => timeToMinutes(e.startTime) > nowMin)
        .sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        )[0];

      if (nextEvent) {
        return {
          busy: false,
          text: `Вільний/-на (о ${nextEvent.startTime})`,
        };
      }

      return {
        busy: false,
        text: "Вільний/-на на сьогодні",
      };
    };

    return {
      me: getStatusForUser(true),
      partner: getStatusForUser(false),
    };
  }, [scheduleItems, currentTime, effectiveUser]);

  // НАДІЙНА КЛАСТЕРИЗАЦІЯ (Інтервальне групування)
  const clusters = useMemo(() => {
    const dayEvents = scheduleItems
      .filter((item) => {
        const matchesDay = item.day === activeDay;
        const matchesUser =
          userFilter === "all" ||
          (userFilter === "mine"
            ? item.owner === effectiveUser
            : item.owner !== effectiveUser);
        return matchesDay && matchesUser;
      })
      .map((ev) => {
        const startMin = timeToMinutes(ev.startTime);
        let endMin = timeToMinutes(ev.endTime);
        if (endMin <= startMin) endMin += 1440;
        return { ...ev, startMin, endMin };
      })
      .sort((a, b) => a.startMin - b.startMin);

    if (dayEvents.length === 0) return [];

    const builtClusters = [];
    let currentCluster = null;

    dayEvents.forEach((event) => {
      const isMine = event.owner === effectiveUser;

      if (!currentCluster) {
        currentCluster = {
          id: `cluster-${event.id}`,
          endMax: event.endMin,
          mine: isMine ? [event] : [],
          partner: !isMine ? [event] : [],
        };
      } else {
        // Якщо подія починається ДО того, як закінчиться поточний блок — це перетин
        if (event.startMin < currentCluster.endMax) {
          currentCluster.endMax = Math.max(currentCluster.endMax, event.endMin);
          if (isMine) currentCluster.mine.push(event);
          else currentCluster.partner.push(event);
        } else {
          // Якщо ні — закриваємо блок і створюємо новий нижче
          builtClusters.push(currentCluster);
          currentCluster = {
            id: `cluster-${event.id}`,
            endMax: event.endMin,
            mine: isMine ? [event] : [],
            partner: !isMine ? [event] : [],
          };
        }
      }
    });

    if (currentCluster) builtClusters.push(currentCluster);
    return builtClusters;
  }, [scheduleItems, activeDay, userFilter, effectiveUser]);

  return (
    <div
      className={`app-background ${isNight ? "theme-night" : "theme-day"} ${getUserThemeClass(userName)}`}
    >
      <CatCompanion />

      {!userName && <NameGate onSubmit={saveUserName} />}
      {showNameGate && userName && (
        <NameGate initial={userName} onSubmit={saveUserName} />
      )}

      <header className="app-header">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-brand">
              <h1 className="hero-title">Наш розклад</h1>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.5rem",
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "var(--radius-control)",
              background: "var(--surface-strong)",
              border: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <span
                style={{ color: statusInfo.me.busy ? "#ef4444" : "#22c55e" }}
              >
                ●
              </span>
              <strong
                style={{
                  flexShrink: 0,
                  maxWidth: "40%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
                title={effectiveUser}
              >
                {truncate(effectiveUser, 14)}:
              </strong>
              <span
                style={{
                  color: "var(--ink)",
                  opacity: 0.9,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {statusInfo.me.text}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <span
                style={{
                  color: statusInfo.partner.busy ? "#ef4444" : "#22c55e",
                }}
              >
                ●
              </span>
              <strong
                style={{
                  flexShrink: 0,
                  maxWidth: "40%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
                title={partnerName}
              >
                {truncate(partnerName, 14)}:
              </strong>
              <span
                style={{
                  color: "var(--ink)",
                  opacity: 0.9,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {statusInfo.partner.text}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-content">
        {actionError && (
          <div className="error-message" role="alert">
            <span>{actionError}</span>
            <button
              type="button"
              className="dialog-icon-button dialog-icon-button--close"
              onClick={() => setActionError("")}
              aria-label="Закрити повідомлення"
            >
              ✕
            </button>
          </div>
        )}

        <div className="list-controls" style={{ marginBottom: "0.5rem" }}>
          <DayTabs
            activeDay={activeDay}
            onSelectDay={setActiveDay}
            eventDays={eventDays}
          />
        </div>

        <div
          className="filter-buttons"
          role="group"
          aria-label="Власник події"
          style={{
            marginBottom: "1rem",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            className={`filter-button ${userFilter === "all" ? "filter-button--active" : ""}`}
            aria-pressed={userFilter === "all"}
            onClick={() => setUserFilter("all")}
          >
            Усі
          </button>
          <button
            type="button"
            className={`filter-button ${userFilter === "mine" ? "filter-button--active" : ""}`}
            aria-pressed={userFilter === "mine"}
            onClick={() => setUserFilter("mine")}
          >
            Тільки мої
          </button>
          <button
            type="button"
            className={`filter-button ${userFilter === "partner" ? "filter-button--active" : ""}`}
            aria-pressed={userFilter === "partner"}
            onClick={() => setUserFilter("partner")}
          >
            Інших
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">Завантаження розкладу…</div>
        ) : loadError ? (
          <div className="no-results">
            <p style={{ margin: "0 0 0.75rem" }}>{loadError}</p>
            <button
              type="button"
              className="retry-button"
              onClick={loadSchedule}
            >
              Спробувати ще раз
            </button>
          </div>
        ) : clusters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❋</div>
            <p className="empty-state-title">Пари відсутні</p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {clusters.map((cluster) => {
              const isParallel =
                cluster.mine.length > 0 && cluster.partner.length > 0;

              return (
                <div
                  key={cluster.id}
                  style={{
                    display: "grid",
                    // minmax(0, 1fr) рятує від розривів через довгі слова
                    gridTemplateColumns: isParallel
                      ? "repeat(2, minmax(0, 1fr))"
                      : "minmax(0, 1fr)",
                    gap: "0.5rem",
                    alignItems: "stretch",
                  }}
                >
                  {/* Ліва колонка — Я */}
                  {cluster.mine.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {cluster.mine.map((item) => (
                        <ScheduleCard
                          key={item.id}
                          item={item}
                          currentTime={currentTime}
                          isCompact={isParallel}
                          onDelete={handleDeleteSchedule}
                          onEdit={setEditingItem}
                        />
                      ))}
                    </div>
                  )}

                  {/* Права колонка — Партнерка */}
                  {cluster.partner.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {cluster.partner.map((item) => (
                        <ScheduleCard
                          key={item.id}
                          item={item}
                          currentTime={currentTime}
                          isCompact={isParallel}
                          onDelete={handleDeleteSchedule}
                          onEdit={setEditingItem}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Taskbar
        userName={userName}
        onChangeUser={() => setShowNameGate(true)}
        onAdd={() => setShowAddSchedule(true)}
      />

      {showAddSchedule && (
        <AddScheduleModal
          currentUser={effectiveUser}
          defaultDay={activeDay}
          onClose={() => setShowAddSchedule(false)}
          onSave={handleSaveSchedule}
        />
      )}

      {editingItem && (
        <AddScheduleModal
          currentUser={editingItem.owner}
          defaultDay={editingItem.day}
          initialItem={editingItem}
          title="Редагувати подію"
          submitLabel="Зберегти зміни"
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateSchedule}
        />
      )}
    </div>
  );
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function truncate(str, max = 15) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7;
}

function getCurrentTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
