-- فاز ۵.۱۲ — Limited Admin و Permission Center
-- اعمال‌شده روی پروژهٔ Supabase از طریق دو migration (به‌ترتیب زیر، اینجا
-- برای مرجع در یک فایل ادغام شده‌اند). جدول admins و توابع is_admin/
-- is_super_admin/has_admin_section از قبل در فاز ۳.۱/۳.۲ ساخته شده بودند؛
-- این فاز فقط محدودسازی/audit/توابع خواندنی UI را اضافه می‌کند — هیچ RLS
-- policy موجودی تغییر نکرده است.

-- ============================================================================
-- Migration 1: phase_5_12_admin_permission_center
-- ============================================================================

-- ۱. محدودسازی مقادیر allowed_sections به بخش‌های واقعاً شناخته‌شده در RLS فاز ۳.۲
alter table admins
  add constraint admins_allowed_sections_valid
  check (
    allowed_sections is null
    or allowed_sections <@ array['routes','fleet','trips','bookings','payments','loyalty','customers']::text[]
  );

-- ۲. جدول audit مخصوص تغییرات دسترسی ادمین (نسخهٔ محدود؛ audit log عمومی بدهی فاز ۱۳ است)
create table admin_access_audit (
  id uuid primary key default gen_random_uuid(),
  target_admin_id uuid not null references admins(id) on delete cascade,
  actor_auth_user_id uuid,
  actor_full_name text,
  change_type text not null check (
    change_type in ('created','role_changed','sections_changed','activated','deactivated','renamed')
  ),
  old_value jsonb,
  new_value jsonb,
  occurred_at timestamptz not null default now()
);

create index admin_access_audit_target_idx on admin_access_audit (target_admin_id, occurred_at desc);

alter table admin_access_audit enable row level security;

create policy admin_access_audit_super_select on admin_access_audit
  for select using (public.is_super_admin());

-- ۳. تریگر AFTER: ثبت خودکار هر تغییر حساس روی admins (INSERT/UPDATE)
create or replace function public.log_admin_access_change()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
begin
  select full_name into v_actor_name from admins where auth_user_id = v_actor_id;

  if tg_op = 'INSERT' then
    insert into admin_access_audit (target_admin_id, actor_auth_user_id, actor_full_name, change_type, old_value, new_value)
    values (
      new.id, v_actor_id, v_actor_name, 'created', null,
      jsonb_build_object('full_name', new.full_name, 'role', new.role, 'allowed_sections', new.allowed_sections, 'is_active', new.is_active)
    );
    return new;
  end if;

  if old.role is distinct from new.role then
    insert into admin_access_audit (target_admin_id, actor_auth_user_id, actor_full_name, change_type, old_value, new_value)
    values (new.id, v_actor_id, v_actor_name, 'role_changed', jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;

  if old.allowed_sections is distinct from new.allowed_sections then
    insert into admin_access_audit (target_admin_id, actor_auth_user_id, actor_full_name, change_type, old_value, new_value)
    values (new.id, v_actor_id, v_actor_name, 'sections_changed', jsonb_build_object('allowed_sections', old.allowed_sections), jsonb_build_object('allowed_sections', new.allowed_sections));
  end if;

  if old.is_active is distinct from new.is_active then
    insert into admin_access_audit (target_admin_id, actor_auth_user_id, actor_full_name, change_type, old_value, new_value)
    values (new.id, v_actor_id, v_actor_name, case when new.is_active then 'activated' else 'deactivated' end,
      jsonb_build_object('is_active', old.is_active), jsonb_build_object('is_active', new.is_active));
  end if;

  if old.full_name is distinct from new.full_name then
    insert into admin_access_audit (target_admin_id, actor_auth_user_id, actor_full_name, change_type, old_value, new_value)
    values (new.id, v_actor_id, v_actor_name, 'renamed', jsonb_build_object('full_name', old.full_name), jsonb_build_object('full_name', new.full_name));
  end if;

  return new;
end;
$$;

create trigger admins_audit_trigger
after insert or update on admins
for each row execute function public.log_admin_access_change();

-- ۴. تریگر BEFORE: جلوگیری از قفل‌کردن خودِ super_admin (تغییر نقش خودش/غیرفعال‌کردن خودش)
create or replace function public.prevent_self_admin_lockout()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if old.auth_user_id is not null and old.auth_user_id = auth.uid() then
    if new.role is distinct from old.role then
      raise exception 'SELF_ROLE_CHANGE_BLOCKED';
    end if;
    if old.is_active = true and new.is_active = false then
      raise exception 'SELF_DEACTIVATE_BLOCKED';
    end if;
  end if;
  return new;
end;
$$;

create trigger admins_prevent_self_lockout
before update on admins
for each row execute function public.prevent_self_admin_lockout();

-- ۵. توابع خواندنی UI برای تب مدیریت ادمین‌ها (فقط super_admin؛ خودشان gate می‌کنند)
create or replace function public.list_admins_with_email()
returns table (
  id uuid,
  auth_user_id uuid,
  email text,
  full_name text,
  role admin_role,
  allowed_sections text[],
  is_active boolean,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select a.id, a.auth_user_id, u.email, a.full_name, a.role, a.allowed_sections, a.is_active, u.last_sign_in_at, a.created_at
  from admins a
  left join auth.users u on u.id = a.auth_user_id
  where public.is_super_admin()
  order by a.created_at asc;
$$;

revoke all on function public.list_admins_with_email() from public;
grant execute on function public.list_admins_with_email() to authenticated;

create or replace function public.list_admin_audit_log(p_limit int default 50)
returns table (
  id uuid,
  target_admin_id uuid,
  target_full_name text,
  actor_auth_user_id uuid,
  actor_full_name text,
  change_type text,
  old_value jsonb,
  new_value jsonb,
  occurred_at timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select l.id, l.target_admin_id, a.full_name, l.actor_auth_user_id, l.actor_full_name,
         l.change_type, l.old_value, l.new_value, l.occurred_at
  from admin_access_audit l
  left join admins a on a.id = l.target_admin_id
  where public.is_super_admin()
  order by l.occurred_at desc
  limit greatest(1, least(p_limit, 200));
$$;

revoke all on function public.list_admin_audit_log(int) from public;
grant execute on function public.list_admin_audit_log(int) to authenticated;

-- ============================================================================
-- Migration 2: phase_5_12_tighten_function_grants
-- ============================================================================

-- Supabase به‌صورت پیش‌فرض روی schema public یک ALTER DEFAULT PRIVILEGES دارد که
-- به anon/authenticated مستقیماً (نه فقط از طریق PUBLIC) اجازهٔ EXECUTE می‌دهد؛
-- «revoke ... from public» آن گرنت مستقیم را پاک نمی‌کند — باید صریح از خودِ
-- نقش‌ها هم revoke شود.

-- توابع خواندنی UI: فقط authenticated (super_admin خودش را با is_super_admin() فیلتر می‌کند)
revoke execute on function public.list_admins_with_email() from anon;
revoke execute on function public.list_admin_audit_log(int) from anon;

-- توابع تریگر: هیچ نقشی نباید مستقیم از طریق RPC صداشان بزند (فقط توسط خودِ تریگر روی admins)
revoke execute on function public.log_admin_access_change() from anon, authenticated;
revoke execute on function public.prevent_self_admin_lockout() from anon, authenticated;
