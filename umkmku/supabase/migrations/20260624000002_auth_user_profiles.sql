-- User profiles linked to Supabase Auth
create table if not exists user_profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  created_at      timestamptz default now(),
  full_name       text,
  address         text,
  whatsapp_number text,
  skin_type       text,      -- 'oily'|'dry'|'combination'|'sensitive'|'normal'
  skin_concerns   text[],    -- ['acne','brightening',...]
  avatar_url      text
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update using (auth.uid() = id);

-- Auto-create empty profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
