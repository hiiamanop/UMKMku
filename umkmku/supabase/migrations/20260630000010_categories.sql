create table categories (
  slug        text primary key,           -- 'skincare' | 'parfum' | 'fashion' | 'fdb'
  name        text not null,              -- nama tampilan: 'Skincare', 'Parfum', dst
  description text,
  icon        text,                       -- emoji atau nama icon
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into categories (slug, name, description, icon, sort_order) values
  ('skincare', 'Skincare',       'Produk perawatan kulit, serum, moisturizer, dll',  '✨', 1),
  ('parfum',   'Parfum',         'Parfum, body mist, eau de toilette, dll',           '🌸', 2),
  ('fashion',  'Fashion',        'Pakaian, aksesoris, tas, sepatu, dll',              '👗', 3),
  ('fdb',      'Food & Beverage','Makanan, minuman, snack, dll',                      '🍜', 4);

alter table categories enable row level security;

create policy "categories_public_read" on categories
  for select using (true);

create policy "categories_service_all" on categories
  for all using (auth.role() = 'service_role');
