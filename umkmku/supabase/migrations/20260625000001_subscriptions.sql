-- ─── Subscription Plans ───────────────────────────────────────────────────────

create table subscription_plans (
  id                  text primary key,          -- 'free' | 'business' | 'enterprise'
  name                text not null,
  price_monthly       integer not null default 0, -- rupiah, 0 = gratis
  ai_token_limit      bigint not null,            -- token/bulan, -1 = unlimited (internal cap)
  ai_token_hard_cap   bigint,                     -- internal cap jika unlimited (null = pakai limit)
  transaction_limit   integer,                    -- null = unlimited
  is_active           boolean not null default true
);

insert into subscription_plans (id, name, price_monthly, ai_token_limit, ai_token_hard_cap, transaction_limit) values
  ('free',       'Free Trial',  0,       10000,      null,       null),
  ('business',   'Business',    399000,  1000000,    null,       1000),
  ('enterprise', 'Enterprise',  599000,  -1,         50000000,   null);

-- ─── Tenant Subscriptions ─────────────────────────────────────────────────────

create table tenant_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  plan_id                 text not null references subscription_plans(id),
  status                  text not null default 'trial'
                            check (status in ('trial', 'active', 'expired', 'suspended')),

  -- Periode aktif
  trial_ends_at           timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,

  -- Usage tracking (reset tiap awal periode)
  ai_tokens_used          bigint not null default 0,
  transactions_used       integer not null default 0,
  overage_transactions    integer not null default 0,  -- pesanan di atas limit, ditagih bulan depan

  -- Notifikasi: hindari kirim ulang
  notified_80pct          boolean not null default false,  -- notif kuota 80%
  suspended_notified      boolean not null default false,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index idx_tenant_subscriptions_tenant on tenant_subscriptions(tenant_id);
create index idx_tenant_subscriptions_status on tenant_subscriptions(status);

-- ─── Link ke tenants ──────────────────────────────────────────────────────────

alter table tenants
  add column if not exists subscription_id uuid references tenant_subscriptions(id);

-- ─── Top-up Packages ──────────────────────────────────────────────────────────

create table top_up_packages (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  price               integer not null,           -- rupiah
  transaction_quota   integer not null,
  is_active           boolean not null default true
);

insert into top_up_packages (name, price, transaction_quota) values
  ('50 Pesanan Tambahan', 10000, 50);

create table top_up_orders (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  package_id    uuid not null references top_up_packages(id),
  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'cancelled')),
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_top_up_orders_tenant on top_up_orders(tenant_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tenant_subscriptions_updated_at
  before update on tenant_subscriptions
  for each row execute function update_updated_at();
