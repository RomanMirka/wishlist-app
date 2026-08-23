import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import Taskbar from "./components/Taskbar";
import WishlistCard from "./components/WishlistCard";
import AddItemModal from "./components/AddItemModal";
import NameGate from "./components/NameGate";
import CatCompanion from "./components/CatCompanion";

const STORAGE_KEY = "wishlist_user_name";
const PARTICLES = [
  ["8%", "12%", 5, -4, 13, 24, -38],
  ["88%", "28%", 3, -11, 18, -18, -44],
  ["5%", "58%", 4, -2, 16, 28, -32],
  ["82%", "76%", 5, -15, 20, -24, -46],
  ["74%", "43%", 3, -8, 15, 18, -52],
  ["25%", "88%", 4, -5, 19, 32, -42],
  ["61%", "7%", 3, -13, 17, -22, -34],
  ["48%", "68%", 4, -7, 14, 26, -40],
  ["34%", "22%", 2, -10, 21, -16, -28],
  ["94%", "54%", 4, -1, 16, 20, -50],
  ["16%", "39%", 3, -14, 18, 30, -30],
  ["67%", "83%", 2, -6, 15, -28, -36],
  ["42%", "46%", 3, -12, 22, 18, -58],
  ["91%", "10%", 2, -3, 17, -22, -26],
  ["12%", "73%", 4, -9, 20, 24, -48],
  ["56%", "31%", 2, -16, 14, -18, -42],
  ["72%", "61%", 3, -5, 19, 28, -34],
  ["31%", "6%", 2, -11, 16, 16, -30],
];

export default function App() {
  const [userName, setUserName] = useState(getStoredName);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showNameGate, setShowNameGate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isNight, setIsNight] = useState(() => isNightTime());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingItemIds, setPendingItemIds] = useState(() => new Set());

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk-UA");
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" ? !item.claimed_by : Boolean(item.claimed_by));
      const searchable = [item.title, item.place, item.note, item.price]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("uk-UA");
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [items, search, statusFilter]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchItems();

    const channel = supabase
      .channel("items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setItems((current) =>
              current.filter((item) => item.id !== payload.old.id),
            );
            return;
          }
          upsertItem(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const updateTheme = () => setIsNight(isNightTime());
    const id = setInterval(updateTheme, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("app-theme-night", isNight);
    document.documentElement.classList.toggle("app-theme-day", !isNight);
    document.body.classList.toggle("app-theme-night", isNight);
    document.body.classList.toggle("app-theme-day", !isNight);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      isNight ? "#090b11" : "#eef2f3",
    );

    return () => {
      document.documentElement.classList.remove("app-theme-day", "app-theme-night");
      document.body.classList.remove("app-theme-day", "app-theme-night");
    };
  }, [isNight]);

  async function fetchItems() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data ?? []);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function upsertItem(nextItem) {
    setItems((current) => {
      const withoutUpdatedItem = current.filter(
        (item) => item.id !== nextItem.id,
      );
      return [nextItem, ...withoutUpdatedItem].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    });
  }

  async function handleAdd(form) {
    if (!supabase) throw new Error("Supabase не налаштований");
    const { data, error } = await supabase
      .from("items")
      .insert({
        title: form.title.trim(),
        price: form.price.trim() || null,
        place: form.place.trim() || null,
        link: form.link.trim() || null,
        image_url: form.image_url.trim() || null,
        note: form.note.trim() || null,
        added_by: userName,
      })
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Товар не вдалося зберегти");
    upsertItem(data);
  }

  async function handleUpdate(form) {
    if (!editingItem) return;
    if (!supabase) throw new Error("Supabase не налаштований");
    const { data, error } = await supabase
      .from("items")
      .update({
        title: form.title.trim(),
        price: form.price.trim() || null,
        place: form.place.trim() || null,
        link: form.link.trim() || null,
        image_url: form.image_url.trim() || null,
        note: form.note.trim() || null,
      })
      .eq("id", editingItem.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Зміни не вдалося зберегти");
    upsertItem(data);
  }

  function setItemPending(id, pending) {
    setPendingItemIds((current) => {
      const next = new Set(current);
      pending ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handleClaim(item) {
    if (pendingItemIds.has(item.id)) return;
    setItemPending(item.id, true);
    try {
      if (!supabase) throw new Error("Supabase не налаштований");
      const nextClaimedBy = item.claimed_by ? null : userName;
      const { data, error } = await supabase
        .from("items")
        .update({ claimed_by: nextClaimedBy })
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Не вдалося оновити статус товару");
      upsertItem(data);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setItemPending(item.id, false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Видалити «${item.title}» зі списку?`)) return;
    if (pendingItemIds.has(item.id)) return;
    setItemPending(item.id, true);
    try {
      if (!supabase) throw new Error("Supabase не налаштований");
      const { error } = await supabase.from("items").delete().eq("id", item.id);
      if (error) throw error;
      setItems((current) => current.filter(({ id }) => id !== item.id));
      setErrorMsg("");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setItemPending(item.id, false);
    }
  }

  function saveUserName(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // The app still works when private browsing blocks local storage.
    }
    setUserName(name);
    setShowNameGate(false);
  }

  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  return (
    <div className={`app-background ${isNight ? "theme-night" : "theme-day"}`}>
      <div className="ambient-motion" aria-hidden="true" />
      <div className="ambient-particles" aria-hidden="true">
        {PARTICLES.map(([left, top, size, delay, duration, x, y], index) => (
          <span
            key={index}
            className="ambient-particle"
            style={{
              "--particle-left": left,
              "--particle-top": top,
              "--particle-size": `${size}px`,
              "--particle-delay": `${delay}s`,
              "--particle-duration": `${duration}s`,
              "--particle-x": `${x}px`,
              "--particle-y": `${-y}px`,
            }}
          />
        ))}
      </div>
      <CatCompanion />

      {!userName && <NameGate onSubmit={saveUserName} />}
      {showNameGate && userName && (
        <NameGate initial={userName} onSubmit={saveUserName} />
      )}

      <header className="app-header">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-brand">
              <div>
                <h1 className="hero-title">
                  Список бажань
                </h1>
              </div>
            </div>
          </div>
          <p className="hero-description">
            Додавай сюди те, що хочеш, щоб ми придбали. Коли річ уже придбана —
            позначай її.
          </p>
          <div className="hero-counter">
            <span className="item-count">{items.length}</span>
            {items.length === 0
              ? "ще нічого не додано"
              : `${items.length} додано`}
          </div>
        </div>
      </header>

      <main className="app-content">
        {errorMsg && (
          <div className="error-message">
            <span>Помилка: {errorMsg}</span>
            <button type="button" onClick={fetchItems} className="retry-button">
              Спробувати знову
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            Завантаження списку…
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❋</div>
            <p className="empty-state-title">
              Додайте перше бажання
            </p>
          </div>
        ) : (
          <>
            <div className="list-controls" aria-label="Пошук і фільтри">
              <label className="search-field">
                <span className="sr-only">Шукати бажання</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Пошук у списку"
                  className="form-input"
                />
              </label>
              <div className="filter-buttons" role="group" aria-label="Статус товару">
                {[
                  ["all", "Усі"],
                  ["available", "Не придбані"],
                  ["claimed", "Придбані"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`filter-button ${statusFilter === value ? "filter-button--active" : ""}`}
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {visibleItems.length === 0 ? (
              <p className="no-results">Нічого не знайдено. Спробуйте інший запит або фільтр.</p>
            ) : (
              <div className="wishlist-grid">
                {visibleItems.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    currentUser={userName}
                    pending={pendingItemIds.has(item.id)}
                    onClaim={handleClaim}
                    onDelete={handleDelete}
                    onEdit={setEditingItem}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Taskbar
        userName={userName ?? "..."}
        onChangeUser={() => setShowNameGate(true)}
        onAdd={() => setShowAdd(true)}
      />

      {showAdd && (
        <AddItemModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editingItem && (
        <AddItemModal
          initialItem={editingItem}
          title="Редагувати товар"
          submitLabel="Зберегти зміни"
          onClose={() => setEditingItem(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7;
}

function getStoredName() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getErrorMessage(error) {
  return error instanceof Error && error.message
    ? error.message
    : "Сталася неочікувана помилка. Спробуйте ще раз.";
}

function SetupNeeded() {
  return (
    <div className="setup-screen">
      <div className="setup-panel">
        <div className="dialog-titlebar">
          <span className="dialog-title">
            Потрібне налаштування
          </span>
        </div>
        <div className="setup-content">
          <p className="setup-heading">
            Ще один крок перед запуском
          </p>
          <p>
            Створіть файл{" "}
            <code className="inline-code">
              .env
            </code>{" "}
            у корені проєкту на основі{" "}
            <code className="inline-code">
              .env.example
            </code>{" "}
            і додайте туди дані вашого проєкту Supabase. Всі інструкції — у
            файлі{" "}
            <code className="inline-code">
              README.md
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
