alter table users add column if not exists token_version integer not null default 0;

update users set token_version = 0 where token_version is null;
