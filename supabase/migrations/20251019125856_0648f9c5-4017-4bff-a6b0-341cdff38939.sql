-- Create an enum for roles
create type public.app_role as enum ('admin', 'user');

-- Create the user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Enable Row-Level Security
alter table public.user_roles enable row level security;

-- Create RLS policies for user_roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Create a security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Grant the admin user the admin role
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role
from auth.users
where raw_user_meta_data->>'username' = 'admin'
on conflict (user_id, role) do nothing;