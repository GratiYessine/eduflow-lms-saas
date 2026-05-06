alter table users add column if not exists failed_login_attempts integer not null default 0;
alter table users add column if not exists locked_until timestamp with time zone;
alter table users add column if not exists last_login_at timestamp with time zone;
alter table users add column if not exists password_changed_at timestamp with time zone;

create index if not exists idx_refresh_tokens_hash_active on refresh_tokens(token_hash, revoked_at, expires_at);
create index if not exists idx_password_reset_tokens_hash_active on password_reset_tokens(token_hash, used_at, expires_at);
create index if not exists idx_certificates_verify on certificates(verification_code);
create index if not exists idx_learner_progress_training_status on learner_progress(training_id, status);
create index if not exists idx_lesson_progress_lesson_completed on lesson_progress(lesson_id, completed);
