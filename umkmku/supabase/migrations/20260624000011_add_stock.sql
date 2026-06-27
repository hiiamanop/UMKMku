-- Stock management: add stock_quantity + is_preorder to products, expires_at to orders
alter table products add column if not exists stock_quantity integer;
alter table products add column if not exists is_preorder boolean not null default false;

alter table orders add column if not exists expires_at timestamptz;
alter table orders add column if not exists previous_status text;

-- Atomic stock decrement (floor at 0)
create or replace function decrement_stock(p_product_id uuid, p_qty integer)
returns void language sql security definer as $$
  update products
  set stock_quantity = greatest(0, stock_quantity - p_qty)
  where id = p_product_id and stock_quantity is not null;
$$;

-- Atomic stock increment
create or replace function increment_stock(p_product_id uuid, p_qty integer)
returns void language sql security definer as $$
  update products
  set stock_quantity = stock_quantity + p_qty
  where id = p_product_id and stock_quantity is not null;
$$;
