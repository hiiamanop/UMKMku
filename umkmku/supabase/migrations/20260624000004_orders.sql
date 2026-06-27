-- Orders (table mungkin sudah ada dari session sebelumnya, tambah kolom yang kurang)
create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),
  tenant_id          uuid references tenants(id) not null,
  status             text default 'pending_payment',
  total_amount       integer not null default 0,
  notes              text
);

-- Tambah kolom yang mungkin belum ada
alter table orders add column if not exists user_id uuid references auth.users(id);
alter table orders add column if not exists shipping_address text;
alter table orders add column if not exists customer_name text;
alter table orders add column if not exists customer_whatsapp text;
alter table orders add column if not exists courier_name text;
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists shipping_photo_url text;

create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references orders(id) on delete cascade not null,
  product_id    uuid references products(id),
  product_name  text not null,
  product_price integer,
  quantity      integer default 1,
  image_url     text
);

create table if not exists order_chats (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  order_id       uuid references orders(id) on delete cascade not null,
  role           text not null,
  content        text,
  attachment_url text
);

-- RLS
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_chats enable row level security;

-- Drop dulu sebelum recreate (idempotent)
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Users can view own order items" on order_items;
drop policy if exists "Users can insert own order items" on order_items;
drop policy if exists "Users can view own order chats" on order_chats;
drop policy if exists "Users can insert own order chats" on order_chats;

create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on orders for insert with check (auth.uid() = user_id);

create policy "Users can view own order items"
  on order_items for select
  using (order_id in (select id from orders where user_id = auth.uid()));

create policy "Users can insert own order items"
  on order_items for insert
  with check (order_id in (select id from orders where user_id = auth.uid()));

create policy "Users can view own order chats"
  on order_chats for select
  using (order_id in (select id from orders where user_id = auth.uid()));

create policy "Users can insert own order chats"
  on order_chats for insert
  with check (order_id in (select id from orders where user_id = auth.uid()));
