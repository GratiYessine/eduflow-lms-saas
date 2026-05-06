alter table trainer_profiles
    add column verification_status varchar(40) not null default 'APPROVED';

alter table trainer_profiles
    add column motivation text;

alter table trainer_profiles
    add column rejection_reason text;

alter table trainer_profiles
    add column approved_at timestamp with time zone;

alter table trainer_profiles
    add column approved_by bigint references users(id);

create index idx_trainer_profiles_verification_status on trainer_profiles(verification_status);
