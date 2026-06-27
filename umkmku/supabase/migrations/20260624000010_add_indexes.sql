-- Orders: dashboard listing (tenant + time) dan store user listing
create index if not exists idx_orders_tenant_created on orders(tenant_id, created_at desc);
create index if not exists idx_orders_user_tenant    on orders(user_id, tenant_id);
create index if not exists idx_orders_status         on orders(tenant_id, status);

-- Order items: join dari orders
create index if not exists idx_order_items_order     on order_items(order_id);

-- Order chats: fetch per order + sidebar last-message query
create index if not exists idx_order_chats_order_created on order_chats(order_id, created_at desc);

-- Products: dashboard listing
create index if not exists idx_products_tenant_sort on products(tenant_id, sort_order, created_at desc);

-- Wishlists: user + tenant filter
create index if not exists idx_wishlists_user on wishlists(user_id);
