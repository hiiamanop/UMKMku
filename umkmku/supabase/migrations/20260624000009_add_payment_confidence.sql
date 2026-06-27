alter table orders add column if not exists payment_confidence integer; -- 0-100
alter table orders add column if not exists payment_ai_note text;
