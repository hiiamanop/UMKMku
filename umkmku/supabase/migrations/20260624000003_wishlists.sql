create table if not exists wishlists (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  unique(user_id, product_id)
);

alter table wishlists enable row level security;

create policy "Users can manage own wishlist"
  on wishlists for all using (auth.uid() = user_id);
