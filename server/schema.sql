create table if not exists tenants (
  id text primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'operator', 'viewer')),
  password_hash text not null,
  active boolean not null default true,
  is_access_account boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, email),
  unique (id, tenant_id)
);

alter table users add column if not exists is_access_account boolean not null default false;

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'users'
       and column_name = 'is_demo'
  ) then
    update users set is_access_account = is_demo where is_demo = true;
    alter table users drop column is_demo;
  end if;
end
$$;

update users
   set email = split_part(email, '@', 1) || '@seoulfresh.example'
 where tenant_id = 'tenant-seoul-fresh'
   and is_access_account = true
   and email not like '%@seoulfresh.example';

update users
   set email = split_part(email, '@', 1) || '@busancraft.example'
 where tenant_id = 'tenant-busan-craft'
   and is_access_account = true
   and email not like '%@busancraft.example';

create table if not exists sessions (
  id bigserial primary key,
  tenant_id text not null,
  user_id text not null,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (user_id, tenant_id) references users(id, tenant_id) on delete cascade
);

create table if not exists orders (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  order_number text not null,
  ordered_at timestamptz not null,
  customer_name text not null,
  masked_phone text not null,
  region text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  lane text not null,
  priority text not null check (priority in ('high', 'normal', 'low', 'review')),
  status text not null check (status in ('received', 'normalized', 'exception', 'ready', 'shipped')),
  exceptions text[] not null default '{}',
  normalization_notes text[] not null default '{}',
  warehouse text not null,
  shipping_line text not null,
  total_amount integer not null check (total_amount >= 0),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_number),
  unique (id, tenant_id)
);

create table if not exists audit_events (
  id bigserial primary key,
  tenant_id text not null,
  order_id text not null,
  actor_user_id text not null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('admin', 'operator', 'viewer')),
  action text not null,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now(),
  foreign key (order_id, tenant_id) references orders(id, tenant_id) on delete cascade,
  foreign key (actor_user_id, tenant_id) references users(id, tenant_id) on delete restrict
);

drop trigger if exists audit_events_append_only on audit_events;

alter table audit_events add column if not exists actor_name text;
alter table audit_events add column if not exists actor_role text;

update audit_events as audit
   set actor_name = coalesce(audit.actor_name, users.name),
       actor_role = coalesce(audit.actor_role, users.role)
  from users
 where users.id = audit.actor_user_id
   and users.tenant_id = audit.tenant_id
   and (audit.actor_name is null or audit.actor_role is null);

alter table audit_events alter column actor_name set not null;
alter table audit_events alter column actor_role set not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'audit_events_actor_role_check'
       and conrelid = 'audit_events'::regclass
  ) then
    alter table audit_events
      add constraint audit_events_actor_role_check
      check (actor_role in ('admin', 'operator', 'viewer'));
  end if;
end
$$;

create or replace function reject_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  if current_setting('orderops.audit_maintenance', true) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  raise exception 'audit_events are append-only' using errcode = '55000';
end;
$$;

create trigger audit_events_append_only
before update or delete on audit_events
for each row execute function reject_audit_event_mutation();

create index if not exists orders_tenant_status_idx on orders (tenant_id, status, ordered_at desc);
create index if not exists audit_events_order_idx on audit_events (tenant_id, order_id, created_at desc);
create index if not exists sessions_expiry_idx on sessions (expires_at);
create unique index if not exists users_tenant_email_lower_idx on users (tenant_id, lower(email));
