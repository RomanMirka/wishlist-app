-- Виконайте цей файл у Supabase: Project -> SQL Editor -> New query -> вставте вміст -> Run

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price text,
  place text,
  link text,
  image_url text,
  note text,
  priority text not null default 'want' check (priority in ('very_wanted', 'want', 'nice_to_have')),
  added_by text not null default 'Хтось',
  claimed_by text,
  created_at timestamptz not null default now()
);

-- Для уже існуючої таблиці виконайте також міграцію з теки migrations.

-- Швидке завантаження найновіших товарів, навіть коли список виросте.
create index if not exists items_created_at_desc_idx
  on public.items (created_at desc);

alter table public.items enable row level security;

-- Список приватний, але без окремого логіну (двоє користуються спільним посиланням/ключем),
-- тож дозволяємо анонімному ключу читати й писати. Не публікуйте publichable URL цього сайту
-- широко, якщо не хочете, щоб треті особи бачили чи редагували список.
drop policy if exists "anon can read items" on public.items;
create policy "anon can read items" on public.items
  for select using (true);

drop policy if exists "anon can insert items" on public.items;
create policy "anon can insert items" on public.items
  for insert with check (true);

drop policy if exists "anon can update items" on public.items;
create policy "anon can update items" on public.items
  for update using (true);

drop policy if exists "anon can delete items" on public.items;
create policy "anon can delete items" on public.items
  for delete using (true);

-- Увімкніть Realtime для таблиці items:
-- Project -> Database -> Replication -> увімкнути для таблиці "items"

-- Увага щодо безпеки: ці політики навмисно залишають доступ анонімним,
-- щоб поточний сайт працював без входу. Для приватного списку їх треба
-- замінити на політики Supabase Auth + таблицю учасників групи.
