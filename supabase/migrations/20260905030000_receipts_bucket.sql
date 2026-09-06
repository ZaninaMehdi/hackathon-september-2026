-- Public bucket for expense receipt photos.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Anyone can read receipts (public bucket); anyone with a session can upload.
-- Fine for hackathon scope — no per-org path scoping enforced at the storage
-- layer yet.
drop policy if exists "Public read receipts" on storage.objects;
create policy "Public read receipts"
  on storage.objects for select
  using (bucket_id = 'receipts');

drop policy if exists "Authenticated upload receipts" on storage.objects;
create policy "Authenticated upload receipts"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');
