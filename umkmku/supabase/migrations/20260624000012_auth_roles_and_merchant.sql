-- Role pada user_profiles
alter table user_profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'merchant', 'super_admin'));

-- Link tenant ke pemilik (auth.users)
alter table tenants
  add column if not exists owner_id uuid references auth.users(id);

-- sender_type pada order_chats
alter table order_chats
  add column if not exists sender_type text not null default 'ai'
  check (sender_type in ('customer', 'ai', 'merchant'));

-- Backfill data lama
update order_chats set sender_type = 'customer' where role = 'user' and sender_type = 'ai';
update order_chats set sender_type = 'ai' where role = 'assistant' and sender_type = 'ai';

-- Index untuk lookup owner
create index if not exists idx_tenants_owner_id on tenants(owner_id);
