-- OMASTA: customer-submitted Orange locations, approved by an admin before
-- they appear on the Find map.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- Who can do what (enforced here, not in the app):
--   anonymous / signed-in visitors : insert a row, but only as 'pending'
--                                    read rows that are 'approved' (public columns only)
--   admins (app_metadata.role = 'omasta_admin') : read every row, change status
--
-- Make someone an admin (run with their account's email):
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"omasta_admin"}'
--    where email = 'admin@example.com';
-- They must sign out and back in for the new role to reach their session.

create extension if not exists pgcrypto;

create table if not exists public.location_submissions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(btrim(name)) between 2 and 80),
  category        text not null check (category in ('agent', 'shop', 'support', 'money')),
  address         text not null check (char_length(btrim(address)) between 3 and 200),
  latitude        double precision not null check (latitude between 6.8 and 10.1),
  longitude       double precision not null check (longitude between -13.5 and -10.2),
  location_source text not null default 'typed' check (location_source in ('device', 'pin', 'typed')),
  phone           text check (phone is null or char_length(phone) <= 20),
  notes           text check (notes is null or char_length(notes) <= 300),
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note     text check (review_note is null or char_length(review_note) <= 300),
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  submitted_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists location_submissions_status_created_idx
  on public.location_submissions (status, created_at desc);

-- Admin check from the signed JWT. app_metadata can only be written with the
-- service role (dashboard / SQL), never by the user themselves.
create or replace function public.is_omasta_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'omasta_admin', false);
$$;

alter table public.location_submissions enable row level security;

-- Column privileges: the public sees business-listing columns only, never
-- notes, reviewer details or who submitted.
revoke all on public.location_submissions from anon, authenticated;
grant insert (id, name, category, address, latitude, longitude, location_source, phone, notes)
  on public.location_submissions to anon, authenticated;
grant select (id, name, category, address, latitude, longitude, phone, status, created_at)
  on public.location_submissions to anon;
grant select on public.location_submissions to authenticated;
grant update (status, review_note, reviewed_by, reviewed_at)
  on public.location_submissions to authenticated;

drop policy if exists "Anyone can submit a pending location" on public.location_submissions;
create policy "Anyone can submit a pending location"
  on public.location_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and review_note is null
    and (submitted_by is null or submitted_by = auth.uid())
  );

drop policy if exists "Approved locations are public" on public.location_submissions;
create policy "Approved locations are public"
  on public.location_submissions
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "Admins can read every submission" on public.location_submissions;
create policy "Admins can read every submission"
  on public.location_submissions
  for select
  to authenticated
  using (public.is_omasta_admin());

drop policy if exists "Admins can review submissions" on public.location_submissions;
create policy "Admins can review submissions"
  on public.location_submissions
  for update
  to authenticated
  using (public.is_omasta_admin())
  with check (public.is_omasta_admin());
