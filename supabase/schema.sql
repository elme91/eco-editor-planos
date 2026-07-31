create table if not exists public.electrical_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  description text,
  plan_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.electrical_points (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.electrical_projects(id) on delete cascade,
  point_code text not null,
  type text not null,
  room text,
  title text,
  detail text,
  x numeric not null default 50,
  y numeric not null default 50,
  priority text default 'Media',
  circuit text,
  status text default 'Pendiente',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.electrical_projects enable row level security;
alter table public.electrical_points enable row level security;

-- Para uso inicial simple desde tu app con anon key.
-- Si después agregas login, conviene reemplazar estas políticas por políticas por usuario.
drop policy if exists "public read electrical projects" on public.electrical_projects;
drop policy if exists "public insert electrical projects" on public.electrical_projects;
drop policy if exists "public update electrical projects" on public.electrical_projects;
drop policy if exists "public delete electrical projects" on public.electrical_projects;

drop policy if exists "public read electrical points" on public.electrical_points;
drop policy if exists "public insert electrical points" on public.electrical_points;
drop policy if exists "public update electrical points" on public.electrical_points;
drop policy if exists "public delete electrical points" on public.electrical_points;

create policy "public read electrical projects" on public.electrical_projects for select using (true);
create policy "public insert electrical projects" on public.electrical_projects for insert with check (true);
create policy "public update electrical projects" on public.electrical_projects for update using (true);
create policy "public delete electrical projects" on public.electrical_projects for delete using (true);

create policy "public read electrical points" on public.electrical_points for select using (true);
create policy "public insert electrical points" on public.electrical_points for insert with check (true);
create policy "public update electrical points" on public.electrical_points for update using (true);
create policy "public delete electrical points" on public.electrical_points for delete using (true);
