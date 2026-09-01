import { supabase } from "./supabase";

// Place this file next to supabase.js (same folder).
// It translates between the app's camelCase item shape and the
// snake_case columns of the `schedule_items` table (see schedule_schema.sql).

const TABLE = "schedule_items";

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    day: row.day,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    type: row.type,
    owner: row.owner,
  };
}

function toRow(item) {
  return {
    title: item.title,
    day: item.day,
    start_time: item.startTime,
    end_time: item.endTime,
    location: item.location,
    type: item.type,
    owner: item.owner,
  };
}

export async function fetchScheduleItems() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data.map(fromRow);
}

export async function insertScheduleItem(item) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(toRow(item))
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function updateScheduleItem(id, item) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(toRow(item))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function deleteScheduleItem(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// Subscribes to inserts, updates, and deletes so both people see changes live.
// Call the returned function to unsubscribe (e.g. in a useEffect cleanup).
export function subscribeToScheduleChanges({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel("schedule_items_changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: TABLE },
      (payload) => onUpdate?.(fromRow(payload.new)),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: TABLE },
      (payload) => onInsert?.(fromRow(payload.new)),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: TABLE },
      (payload) => onDelete?.(payload.old.id),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
