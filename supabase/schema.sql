-- Виконайте цей файл у Supabase: Project -> SQL Editor -> New query -> вставте вміст -> Run

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price text,
  place text,
  link text,
  image_url text,
  note text,
  added_by text not null default 'Хтось',
  claimed_by text,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

-- Список приватний, але без окремого логіну (двоє користуються спільним посиланням/ключем),
-- тож дозволяємо анонімному ключу читати й писати. Не публікуйте publichable URL цього сайту
-- широко, якщо не хочете, щоб треті особи бачили чи редагували список.
create policy "anon can read items" on public.items
  for select using (true);

create policy "anon can insert items" on public.items
  for insert with check (true);

create policy "anon can update items" on public.items
  for update using (true);

create policy "anon can delete items" on public.items
  for delete using (true);

-- Увімкніть Realtime для таблиці items:
-- Project -> Database -> Replication -> увімкнути для таблиці "items"
