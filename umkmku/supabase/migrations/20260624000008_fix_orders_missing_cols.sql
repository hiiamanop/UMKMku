-- Kolom yang ada di CREATE TABLE IF NOT EXISTS tapi skip karena tabel sudah ada
alter table orders add column if not exists status text not null default 'pending_payment';
alter table orders add column if not exists total_amount integer not null default 0;
alter table orders add column if not exists notes text;
