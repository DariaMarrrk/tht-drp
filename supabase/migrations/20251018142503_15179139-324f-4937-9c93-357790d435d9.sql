-- Create profiles table with username-based authentication
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  username text not null unique,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create thoughts table
create table public.thoughts (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamp with time zone not null default now()
);

-- Enable RLS on thoughts
alter table public.thoughts enable row level security;

-- Thoughts policies
create policy "Users can view their own thoughts"
  on public.thoughts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own thoughts"
  on public.thoughts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own thoughts"
  on public.thoughts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own thoughts"
  on public.thoughts for delete
  using (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger for profile updates
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();