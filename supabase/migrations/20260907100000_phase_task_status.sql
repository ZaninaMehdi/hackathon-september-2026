alter table phase_tasks add column if not exists status text not null default 'todo'
  check (status in ('todo', 'in_progress', 'done'));

update phase_tasks set status = 'done' where done = true;
update phase_tasks set status = 'todo' where done = false;

alter table phase_tasks drop column if exists done;
