-- AI in the Research Process – workshop companion
-- Data model: one row per table (group) and workshop, plus shared use-case additions.
-- Access ONLY through the RPC functions below. The public (anon) key cannot read or
-- write any table directly; every function checks the group code on the server.
-- Codes are stored as SHA-256 hashes, never in clear text.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.workshops (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.access_codes (
  code_hash   text primary key,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  role        text not null check (role in ('table','facilitator','viewer')),
  table_name  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.table_data (
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  table_name  text not null,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (workshop_id, table_name)
);

create table if not exists public.additions (
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  id          text not null,
  data        jsonb not null,
  created_by  text not null,
  updated_at  timestamptz not null default now(),
  primary key (workshop_id, id)
);

-- Lock every table: RLS on, no policies, no grants for the public roles.
alter table public.workshops    enable row level security;
alter table public.access_codes enable row level security;
alter table public.table_data   enable row level security;
alter table public.additions    enable row level security;
revoke all on table public.workshops, public.access_codes, public.table_data, public.additions from anon, authenticated;

-- ---------------------------------------------------------------- helpers
create or replace function public._hash_code(p_code text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(btrim(coalesce(p_code, ''))), 'sha256'), 'hex')
$$;

create or replace function public._code(p_code text) returns public.access_codes
language plpgsql stable security definer set search_path = public, extensions as $$
declare c public.access_codes;
begin
  select * into c from public.access_codes where code_hash = public._hash_code(p_code);
  if c.code_hash is null then
    raise exception 'Unknown code' using errcode = '28000';
  end if;
  return c;
end $$;

-- ---------------------------------------------------------------- client API
create or replace function public.join_workshop(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare c public.access_codes; w public.workshops;
begin
  c := public._code(p_code);
  select * into w from public.workshops where id = c.workshop_id;
  return jsonb_build_object('workshop', w.name, 'slug', w.slug, 'role', c.role,
    'table', case c.role when 'table' then c.table_name when 'facilitator' then 'Facilitator' else null end);
end $$;

create or replace function public.load_room(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare c public.access_codes;
begin
  c := public._code(p_code);
  return jsonb_build_object(
    'tables', coalesce((select jsonb_agg(jsonb_build_object('name', t.table_name, 'data', t.data, 'updated_at', t.updated_at) order by t.table_name)
                        from public.table_data t where t.workshop_id = c.workshop_id), '[]'::jsonb),
    'additions', coalesce((select jsonb_agg(a.data order by a.updated_at)
                           from public.additions a where a.workshop_id = c.workshop_id), '[]'::jsonb),
    'now', now());
end $$;

create or replace function public.save_table(p_code text, p_data jsonb) returns timestamptz
language plpgsql volatile security definer set search_path = public, extensions as $$
declare c public.access_codes; tname text;
begin
  c := public._code(p_code);
  if c.role not in ('table','facilitator') then
    raise exception 'This code is read-only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 200000 then
    raise exception 'Invalid data' using errcode = '22023';
  end if;
  tname := case c.role when 'table' then c.table_name else 'Facilitator' end;
  insert into public.table_data (workshop_id, table_name, data, updated_at)
  values (c.workshop_id, tname, p_data, now())
  on conflict (workshop_id, table_name) do update set data = excluded.data, updated_at = now();
  return now();
end $$;

create or replace function public.save_addition(p_code text, p_item jsonb) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
declare c public.access_codes; me text; aid text; owner text;
begin
  c := public._code(p_code);
  if c.role not in ('table','facilitator') then
    raise exception 'This code is read-only' using errcode = '42501';
  end if;
  aid := p_item->>'id';
  if aid is null or aid !~ '^[a-z0-9-]{3,40}$' or pg_column_size(p_item) > 6000 then
    raise exception 'Invalid use case' using errcode = '22023';
  end if;
  me := case c.role when 'table' then c.table_name else 'Facilitator' end;
  select created_by into owner from public.additions where workshop_id = c.workshop_id and id = aid;
  if owner is not null and owner <> me and c.role <> 'facilitator' then
    raise exception 'Only the table that added this use case can change it' using errcode = '42501';
  end if;
  insert into public.additions (workshop_id, id, data, created_by, updated_at)
  values (c.workshop_id, aid, p_item, coalesce(owner, me), now())
  on conflict (workshop_id, id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.delete_addition(p_code text, p_id text) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
declare c public.access_codes; me text;
begin
  c := public._code(p_code);
  if c.role not in ('table','facilitator') then
    raise exception 'This code is read-only' using errcode = '42501';
  end if;
  me := case c.role when 'table' then c.table_name else 'Facilitator' end;
  delete from public.additions
   where workshop_id = c.workshop_id and id = p_id and (created_by = me or c.role = 'facilitator');
end $$;

create or replace function public.reset_workshop(p_code text) returns void
language plpgsql volatile security definer set search_path = public, extensions as $$
declare c public.access_codes;
begin
  c := public._code(p_code);
  if c.role <> 'facilitator' then
    raise exception 'Only the facilitator can reset the workshop' using errcode = '42501';
  end if;
  delete from public.table_data where workshop_id = c.workshop_id;
  delete from public.additions  where workshop_id = c.workshop_id;
end $$;

-- ---------------------------------------------------------------- grants
revoke all on function public._hash_code(text), public._code(text) from public, anon, authenticated;
revoke all on function public.join_workshop(text), public.load_room(text), public.save_table(text, jsonb),
  public.save_addition(text, jsonb), public.delete_addition(text, text), public.reset_workshop(text)
  from public, anon, authenticated;
grant execute on function public.join_workshop(text), public.load_room(text), public.save_table(text, jsonb),
  public.save_addition(text, jsonb), public.delete_addition(text, text), public.reset_workshop(text)
  to anon, authenticated;
