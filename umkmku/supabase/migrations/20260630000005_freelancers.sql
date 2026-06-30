-- Freelancer profiles
create table if not exists freelancers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  bio text,
  portfolio_url text,
  payment_info jsonb, -- { bank: string, account: string, holder: string }
  verified_at timestamptz,
  total_earnings integer not null default 0, -- in rupiah
  created_at timestamptz not null default now()
);

-- Template submissions from freelancers (before admin approval)
create table if not exists template_submissions (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references freelancers(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('skincare', 'parfum', 'fashion', 'fdb')),
  repo_url text not null,
  demo_url text not null,
  preview_image_urls jsonb not null default '[]'::jsonb,
  security_report jsonb, -- auto-generated scan results
  admin_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'live')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- Add FK from templates to freelancers now that the table exists
alter table templates
  add constraint templates_freelancer_id_fkey
  foreign key (freelancer_id) references freelancers(id) on delete set null;

-- RLS
alter table freelancers enable row level security;
alter table template_submissions enable row level security;

create policy "freelancers_own_read" on freelancers
  for select using (user_id = auth.uid());

create policy "freelancers_own_insert" on freelancers
  for insert with check (user_id = auth.uid());

create policy "freelancers_own_update" on freelancers
  for update using (user_id = auth.uid());

create policy "freelancers_service_all" on freelancers
  for all using (auth.role() = 'service_role');

create policy "submissions_own" on template_submissions
  for all using (
    freelancer_id in (select id from freelancers where user_id = auth.uid())
  );

create policy "submissions_service_all" on template_submissions
  for all using (auth.role() = 'service_role');
