-- Friendly per-org project URLs (/org-slug/project-slug instead of a raw
-- UUID) for shareable links and QR codes.

alter table projects add column if not exists slug text;

-- Backfill existing rows from their titles.
update projects
set slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
where slug is null;

-- Disambiguate any duplicate slugs within the same org (append -2, -3, ...).
with numbered as (
  select id, org_id, slug,
    row_number() over (partition by org_id, slug order by created_at) as rn
  from projects
)
update projects p
set slug = p.slug || '-' || numbered.rn
from numbered
where p.id = numbered.id and numbered.rn > 1;

alter table projects alter column slug set not null;
create unique index if not exists idx_projects_org_slug on projects(org_id, slug);
