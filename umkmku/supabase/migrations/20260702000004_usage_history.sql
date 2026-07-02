create table if not exists tenant_usage_daily (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  date          date not null,
  tokens_used   bigint not null default 0,
  orders_used   int not null default 0,
  addon_used    int not null default 0,
  unique (tenant_id, date)
);

create index if not exists idx_tenant_usage_daily_tenant_date on tenant_usage_daily(tenant_id, date desc);
