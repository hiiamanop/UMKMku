create table subscription_invoices (
  id                      uuid primary key default gen_random_uuid(),
  external_id             text unique not null,           -- untuk match Xendit webhook
  plan_id                 text not null references subscription_plans(id),
  email                   text not null,
  full_name               text,

  -- Pricing breakdown
  amount                  integer not null,               -- harga plan (sebelum pajak)
  ppn                     integer not null,
  xendit_fee              integer not null,
  final_amount            integer not null,               -- yang dibayar merchant

  -- Xendit
  xendit_invoice_id       text,
  xendit_invoice_url      text,

  -- Status
  status                  text not null default 'pending'
                            check (status in ('pending', 'paid', 'expired', 'failed')),
  paid_at                 timestamptz,

  -- Link ke tenant setelah onboarding
  tenant_id               uuid references tenants(id),
  onboarding_completed_at timestamptz,

  created_at              timestamptz not null default now()
);

create index idx_subscription_invoices_external on subscription_invoices(external_id);
create index idx_subscription_invoices_email    on subscription_invoices(email);
create index idx_subscription_invoices_status   on subscription_invoices(status);
