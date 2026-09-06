-- Public bucket for campaign cover photos and org logo/cover images.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "Authenticated upload media" on storage.objects;
create policy "Authenticated upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

-- Masjid/org profile: description + logo/cover photos.
alter table organizations add column if not exists description text;
alter table organizations add column if not exists logo_url text;
alter table organizations add column if not exists cover_image_url text;

-- Per-member preference (self-service, not org-wide).
alter table members add column if not exists email_notifications_enabled boolean not null default true;
