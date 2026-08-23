-- Додає пріоритети без видалення або зміни існуючих товарів.
-- Існуючі товари отримають значення «Хочу».

alter table public.items
  add column if not exists priority text not null default 'want';

update public.items
set priority = 'want'
where priority is null or priority not in ('very_wanted', 'want', 'nice_to_have');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_priority_check'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_priority_check
      check (priority in ('very_wanted', 'want', 'nice_to_have'));
  end if;
end $$;
