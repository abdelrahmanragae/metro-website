-- Metro CMS v1. Run in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(),
 name text not null, slug text unique not null,
 description text not null default '', cover_url text not null default '',
 cover_type text not null default 'image',
 published boolean not null default false,
 on_homepage boolean not null default false,
 blocks jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.team_members (
 id uuid primary key default gen_random_uuid(),
 name text not null, job_title text not null default '',
 photo_url text not null default '', visible boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.pages (
 id uuid primary key default gen_random_uuid(),
 slug text unique not null, title text not null,
 intro text not null default '', sections jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.contact_links (
 id uuid primary key default gen_random_uuid(),
 label text not null, value text not null default '',
 url text not null default '', visible boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 120),
 email text not null check (char_length(email) between 3 and 254),
 message text not null check (char_length(message) between 1 and 5000),
 is_read boolean not null default false,
 created_at timestamptz not null default now()
);
insert into public.pages(slug,title,intro) values
 ('about','About Metro',''),('contact','Start a Journey','')
 on conflict(slug) do nothing;
alter table public.projects enable row level security;
alter table public.team_members enable row level security;
alter table public.pages enable row level security;
alter table public.contact_links enable row level security;
alter table public.messages enable row level security;
-- Initial phase: invited authenticated team members share editorial permissions.
-- Never enable public UPDATE/DELETE, and never expose service_role keys in browser.
drop policy if exists "public published projects" on public.projects;
create policy "public published projects" on public.projects for select to anon using (published);
drop policy if exists "public visible team" on public.team_members;
create policy "public visible team" on public.team_members for select to anon using (visible);
drop policy if exists "public pages" on public.pages;
create policy "public pages" on public.pages for select to anon using (true);
drop policy if exists "public visible contacts" on public.contact_links;
create policy "public visible contacts" on public.contact_links for select to anon using (visible);
drop policy if exists "authenticated projects" on public.projects;
create policy "authenticated projects" on public.projects for all to authenticated using (true) with check (true);
drop policy if exists "authenticated team" on public.team_members;
create policy "authenticated team" on public.team_members for all to authenticated using (true) with check (true);
drop policy if exists "authenticated pages" on public.pages;
create policy "authenticated pages" on public.pages for all to authenticated using (true) with check (true);
drop policy if exists "authenticated contacts" on public.contact_links;
create policy "authenticated contacts" on public.contact_links for all to authenticated using (true) with check (true);
drop policy if exists "authenticated inbox" on public.messages;
create policy "authenticated inbox" on public.messages for all to authenticated using (true) with check (true);
-- Public form submission should use a server-side endpoint with rate limits and spam protection.
-- No anon INSERT policy is intentionally defined for messages yet.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('media','media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
 on conflict(id) do nothing;
drop policy if exists "studio uploads" on storage.objects;
create policy "studio uploads" on storage.objects for insert to authenticated with check (bucket_id='media');
drop policy if exists "studio updates media" on storage.objects;
create policy "studio updates media" on storage.objects for update to authenticated using (bucket_id='media') with check (bucket_id='media');
drop policy if exists "studio deletes media" on storage.objects;
create policy "studio deletes media" on storage.objects for delete to authenticated using (bucket_id='media');
