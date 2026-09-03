# فاز ۳.۳ — احراز هویت پنل ادمین (Supabase Auth)

## ۱. فایل‌های این تحویل

| فایل | نوع تغییر |
|---|---|
| `package.json` | افزایشی — دو وابستگی جدید اضافه شده (`@supabase/ssr`, `@supabase/supabase-js`) |
| `lib/supabase/client.ts` | جدید — کلاینت مرورگر |
| `lib/supabase/server.ts` | جدید — کلاینت سرور (Server Component/Route Handler) |
| `middleware.ts` | جدید — محافظت مسیرهای `/admin/*` |
| `app/admin/login/page.tsx` | جدید — صفحهٔ ورود ادمین |
| `app/admin/page.tsx` | جدید — نقطهٔ ورود محافظت‌شده که `AdminPanel` موجود را رندر می‌کند |
| `components/transport/admin-panel.tsx` | افزایشی — دو لینک نمایشی خروج به دکمهٔ واقعی `signOut()` تبدیل شده‌اند؛ هیچ بخش دیگری از فایل تغییر نکرده |
| `.env.local.example` | جدید — راهنمای متغیر محیطی |
| `phase-3.3-bootstrap-admin.sql` | جدید — اسکریپت اتصال اولین super_admin |

## ۲. نصب و متغیرهای محیطی

```bash
pnpm install
cp .env.local.example .env.local
```

مقدار `NEXT_PUBLIC_SUPABASE_ANON_KEY` را از Dashboard Supabase پروژهٔ
`Transportation-System` → Settings → API بردارید و در `.env.local` بگذارید.
`NEXT_PUBLIC_SUPABASE_URL` از قبل پر شده (`https://ppbdsrcdnmckosqhhamm.supabase.co`).

## ۳. بوت‌استرپ اولین حساب super_admin

ساخت مستقیم کاربر Auth از طریق SQL خام پشتیبانی‌شده نیست (هش رمز عبور و
فیلدهای داخلی auth.users باید از طریق Admin API ساخته شوند)، پس:

1. در Dashboard Supabase → Authentication → Users → **Add user** یک کاربر
   با ایمیل `zakirnaseri2004@gmail.com` و یک رمز عبور دلخواه بسازید
   (گزینهٔ «Auto Confirm User» را فعال کنید تا نیازی به تأیید ایمیل نباشد).
2. اسکریپت `phase-3.3-bootstrap-admin.sql` را در SQL Editor پروژه اجرا کنید
   (یا به من بگویید کاربر ساخته شده تا خودم از طریق دسترسی MCP اجرا کنم).
3. با همان ایمیل/رمز در `/admin/login` وارد شوید.

## ۴. نکات فنی

- تشخیص ادمین از طریق تابع `public.is_admin()` (ساخته‌شده در فاز ۳.۲) در
  هم `middleware.ts` و هم `app/admin/page.tsx` انجام می‌شود — دو لایه، نه یک لایه.
- کاربر واردشده‌ای که در جدول `admins` نیست، به‌صورت خودکار `signOut` و به
  `/admin/login?error=not_admin` هدایت می‌شود.
- مدیریت نقش‌های ادمین محدود (`AdminRoleManager`) و صفحهٔ ثبت‌نام ادمین جدید
  عمداً در این فاز ساخته نشده — طبق فازبندی، بخشی از فاز ۵.۱ است.
- عملیات نوشتن حساس (رزرو/پرداخت) هنوز به این فاز مربوط نیست؛ کلاینت‌های
  ساخته‌شده اینجا فقط سطح دسترسی `anon` دارند، دقیقاً طبق بخش ۸.۲.
