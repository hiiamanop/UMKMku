-- Tambah kolom payment ke top_up_orders
alter table top_up_orders
  add column if not exists quantity int not null default 1,
  add column if not exists amount bigint not null default 10000,
  add column if not exists payment_proof_url text,
  add column if not exists paid_at timestamptz;

-- Tambah addon quota ke tenant_subscriptions (tidak expired, hanya berkurang setelah kuota utama habis)
alter table tenant_subscriptions
  add column if not exists transactions_addon int not null default 0;
