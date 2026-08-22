import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import Taskbar from "./components/Taskbar";
import WishlistCard from "./components/WishlistCard";
import AddItemModal from "./components/AddItemModal";
import NameGate from "./components/NameGate";
import CatCompanion from "./components/CatCompanion";

const STORAGE_KEY = "wishlist_user_name";

export default function App() {
  const [userName, setUserName] = useState(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showNameGate, setShowNameGate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isNight, setIsNight] = useState(() => isNightTime());

  const orbs = useMemo(() => makeOrbs(), []);

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
        () => {
          fetchItems();
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

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setItems(data);
      setErrorMsg("");
    }
    setLoading(false);
  }

  async function handleAdd(form) {
    const { error } = await supabase.from("items").insert({
      title: form.title.trim(),
      price: form.price.trim() || null,
      place: form.place.trim() || null,
      link: form.link.trim() || null,
      image_url: form.image_url.trim() || null,
      note: form.note.trim() || null,
      added_by: userName,
    });
    if (error) throw error;
    fetchItems();
  }

  async function handleClaim(item) {
    const nextClaimedBy = item.claimed_by ? null : userName;
    const { error } = await supabase
      .from("items")
      .update({ claimed_by: nextClaimedBy })
      .eq("id", item.id);
    if (!error) fetchItems();
  }

  async function handleDelete(item) {
    if (!confirm(`Видалити «${item.title}» зі списку?`)) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (!error) fetchItems();
  }

  function saveUserName(name) {
    localStorage.setItem(STORAGE_KEY, name);
    setUserName(name);
    setShowNameGate(false);
  }

  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  return (
    <div className={`app-background ${isNight ? "theme-night" : "theme-day"}`}>
      <CatCompanion />
      {orbs.map((o) => (
        <div key={o.id} className="background-orb" style={o.style} />
      ))}

      {!userName && <NameGate onSubmit={saveUserName} />}
      {showNameGate && userName && (
        <NameGate initial={userName} onSubmit={saveUserName} />
      )}

      <header className="app-header">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-brand">
              <div className="site-logo" aria-label="Список бажань">♥</div>
              <div>
                <h1 className="hero-title">
                  Список бажань
                </h1>
              </div>
            </div>
          </div>
          <p className="hero-description">
            Додавай сюди те, що хочеш, щоб ми купили. Коли річ уже куплена —
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
            Помилка завантаження: {errorMsg}
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
          <div className="wishlist-grid">
            {items.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                currentUser={userName}
                onClaim={handleClaim}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <Taskbar
        count={items.length}
        userName={userName ?? "..."}
        onChangeUser={() => setShowNameGate(true)}
        onAdd={() => setShowAdd(true)}
      />

      {showAdd && (
        <AddItemModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function makeOrbs() {
  const configs = [
    { top: "4%", size: 70, dur: 46, tint: "rgba(0,209,178,0.5)", scale: 1 },
    { top: "16%", size: 42, dur: 34, tint: "rgba(193,79,224,0.4)", scale: 0.9 },
    { top: "2%", size: 100, dur: 60, tint: "rgba(28,111,224,0.4)", scale: 1.1 },
    { top: "28%", size: 30, dur: 26, tint: "rgba(255,93,143,0.4)", scale: 0.8 },
    {
      top: "9%",
      size: 55,
      dur: 52,
      tint: "rgba(255,201,60,0.35)",
      scale: 0.95,
    },
  ];
  return configs.map((c, i) => ({
    id: i,
    style: {
      top: c.top,
      width: c.size,
      height: c.size,
      "--orb-tint": c.tint,
      "--s": c.scale,
      animationDuration: `${c.dur}s`,
      animationDelay: `${-i * 13}s`,
    },
  }));
}

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7;
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
