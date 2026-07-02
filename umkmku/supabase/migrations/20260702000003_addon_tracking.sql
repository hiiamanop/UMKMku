-- transactions_addon = total yang pernah dibeli (tidak berkurang)
-- transactions_addon_used = yang sudah terpakai dari pool add-on
alter table tenant_subscriptions
  add column if not exists transactions_addon_used int not null default 0;
