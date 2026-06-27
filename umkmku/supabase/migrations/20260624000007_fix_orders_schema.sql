-- Drop kolom lama dari schema orders v1 yang incompatible dengan schema baru
alter table orders drop column if exists customer_id;
alter table orders drop column if exists customer_email;
alter table orders drop column if exists customer_phone;
alter table orders drop column if exists items;
alter table orders drop column if exists subtotal;
alter table orders drop column if exists ppn;
alter table orders drop column if exists subtotal_with_ppn;
alter table orders drop column if exists xendit_fee;
alter table orders drop column if exists final_price;
alter table orders drop column if exists qris_code;
alter table orders drop column if exists qris_image_url;
alter table orders drop column if exists payment_status;
alter table orders drop column if exists order_status;
alter table orders drop column if exists payment_method;
alter table orders drop column if exists payment_proof_url;
alter table orders drop column if exists xendit_invoice_id;
alter table orders drop column if exists xendit_invoice_url;
alter table orders drop column if exists xendit_payment_id;
alter table orders drop column if exists metadata;

-- Drop tabel customers lama yang tidak dipakai
drop table if exists public.customers cascade;

-- Drop policy lama dari migration pertama yang conflik
drop policy if exists "Tenants can view their orders" on orders;
drop policy if exists "Tenants can create orders" on orders;
drop policy if exists "Tenants can update their orders" on orders;
