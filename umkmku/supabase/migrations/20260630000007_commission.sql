-- Track which merchant uses which template
create table if not exists template_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  template_id uuid not null references templates(id) on delete cascade,
  started_at timestamptz not null default now(),
  unique(tenant_id) -- one active template per tenant
);

-- Commission ledger: earnings per freelancer per period
create table if not exists commission_ledger (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references freelancers(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  amount integer not null, -- rupiah
  period text not null,    -- 'YYYY-MM'
  tenant_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'requested', 'paid')),
  requested_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Commission rate: 20% of monthly subscription revenue per tenant using the template
-- Actual calculation done in cron job

-- Trigger: when tenant.template_id changes, update template_usage
create or replace function sync_template_usage()
returns trigger as $$
begin
  if new.template_id is null then
    delete from template_usage where tenant_id = new.id;
  elsif old.template_id is distinct from new.template_id then
    insert into template_usage (tenant_id, template_id)
      values (new.id, new.template_id)
      on conflict (tenant_id) do update set template_id = excluded.template_id, started_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_tenant_template_change
  after update of template_id on tenants
  for each row execute function sync_template_usage();

-- Also insert on new tenant if template_id set
create or replace function sync_template_usage_insert()
returns trigger as $$
begin
  if new.template_id is not null then
    insert into template_usage (tenant_id, template_id)
      values (new.id, new.template_id)
      on conflict (tenant_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_tenant_insert_template
  after insert on tenants
  for each row execute function sync_template_usage_insert();

-- RLS
alter table template_usage enable row level security;
alter table commission_ledger enable row level security;

create policy "template_usage_service" on template_usage for all using (auth.role() = 'service_role');
create policy "commission_own_read" on commission_ledger
  for select using (
    freelancer_id in (select id from freelancers where user_id = auth.uid())
  );
create policy "commission_service_all" on commission_ledger for all using (auth.role() = 'service_role');
