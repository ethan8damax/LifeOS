-- Replace frequency text column with days text[] for custom day picker
alter table habits add column if not exists days text[] default array['mon','tue','wed','thu','fri','sat','sun'];
alter table habits drop column if exists frequency;
