create table if not exists public.harvest_records (
  id bigint generated always as identity primary key,
  transaction_no text not null unique,
  harvest_date date not null,
  batch_information text not null,
  harvest_weight numeric not null check (harvest_weight > 0),
  delivery_date date not null,
  remarks text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_records (
  id bigint generated always as identity primary key,
  invoice_no text not null unique,
  delivery_date date not null,
  harvest_weight numeric not null check (harvest_weight > 0),
  rejected_quantity numeric not null default 0 check (rejected_quantity >= 0),
  quality_grade text not null check (quality_grade in ('A', 'B', 'C')),
  payment_amount numeric not null default 0 check (payment_amount >= 0),
  created_at timestamptz not null default now()
);

alter table public.harvest_records enable row level security;
alter table public.invoice_records enable row level security;

drop policy if exists "Prototype read harvest records" on public.harvest_records;
drop policy if exists "Prototype insert harvest records" on public.harvest_records;
drop policy if exists "Prototype read invoice records" on public.invoice_records;
drop policy if exists "Prototype insert invoice records" on public.invoice_records;

create policy "Prototype read harvest records"
on public.harvest_records for select
to anon
using (true);

create policy "Prototype insert harvest records"
on public.harvest_records for insert
to anon
with check (true);

create policy "Prototype read invoice records"
on public.invoice_records for select
to anon
using (true);

create policy "Prototype insert invoice records"
on public.invoice_records for insert
to anon
with check (true);

insert into public.harvest_records
  (transaction_no, harvest_date, batch_information, harvest_weight, delivery_date, remarks)
values
  ('HT-2026-001', '2026-06-01', 'Batch A - South Block', 1840, '2026-06-02', 'Delivered complete'),
  ('HT-2026-002', '2026-06-03', 'Batch B - Riverside', 2130, '2026-06-04', 'Includes second picking'),
  ('HT-2026-003', '2026-06-06', 'Batch C - Main Road', 1675, '2026-06-07', 'Ready for verification')
on conflict (transaction_no) do nothing;

insert into public.invoice_records
  (invoice_no, delivery_date, harvest_weight, rejected_quantity, quality_grade, payment_amount)
values
  ('INV-PLANT-0917', '2026-06-02', 1840, 72, 'A', 75440),
  ('INV-PLANT-0921', '2026-06-04', 2130, 156, 'B', 83160),
  ('INV-PLANT-0926', '2026-06-07', 1675, 48, 'A', 69750)
on conflict (invoice_no) do nothing;
