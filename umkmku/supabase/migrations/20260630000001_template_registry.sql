-- Template registry: stores metadata for all approved templates
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null check (category in ('skincare', 'parfum', 'fashion', 'fdb')),
  template_key text not null unique,
  preview_urls jsonb not null default '[]'::jsonb,
  demo_url text,
  is_active boolean not null default false,
  freelancer_id uuid, -- FK to freelancers added in 20260630000005_freelancers.sql
  source_repo_url text,
  created_at timestamptz not null default now()
);

-- Seed default templates (built-in)
insert into templates (name, category, template_key, is_active) values
  ('Skincare Default', 'skincare', 'skincare-default', true),
  ('Parfum Default', 'parfum', 'parfum-default', true),
  ('Fashion Default', 'fashion', 'fashion-default', true),
  ('FnB Default', 'fdb', 'fnb-default', true)
on conflict (template_key) do nothing;

-- Add template_id to tenants (null = use category default)
alter table tenants
  add column if not exists template_id uuid references templates(id) on delete set null;

-- RLS: public read active templates
alter table templates enable row level security;

create policy "templates_public_read" on templates
  for select using (is_active = true);

create policy "templates_service_all" on templates
  for all using (auth.role() = 'service_role');
