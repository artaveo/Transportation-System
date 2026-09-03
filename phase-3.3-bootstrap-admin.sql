-- فاز ۳.۳ — بوت‌استرپ اولین حساب super_admin
-- طبق بخش ۸.۲ پرامپت مادر: ایمیل zakirnaseri2004@gmail.com
--
-- پیش‌نیاز: کاربر باید از قبل در Supabase Auth ساخته شده باشد
-- (Dashboard → Authentication → Users → Add user)، چون ساخت مستقیم کاربر
-- Auth از طریق SQL خام (بدون Admin API) امن/پشتیبانی‌شده نیست.
--
-- این اسکریپت idempotent است: اگر رکورد admins برای این کاربر از قبل
-- وجود داشته باشد، فقط role/is_active را به‌روزرسانی می‌کند (INSERT دوباره نمی‌زند).

insert into admins (auth_user_id, full_name, role, is_active)
select id, 'Zakir Naseri', 'super_admin', true
from auth.users
where email = 'zakirnaseri2004@gmail.com'
on conflict (auth_user_id) do update
  set role = excluded.role,
      is_active = excluded.is_active;

-- بررسی نتیجه:
-- select * from admins where auth_user_id = (select id from auth.users where email = 'zakirnaseri2004@gmail.com');
