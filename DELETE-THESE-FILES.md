# فایل‌های حذف‌شده (باید دستی از ریپوی خودتان حذف کنید)

این دو فایل به‌عنوان یتیم/duplicate شناسایی و در چک‌شدهٔ Claude حذف شدند؛ چون
zip فقط فایل‌های افزوده/تغییریافته را نگه می‌دارد، خودتان این دو را حذف کنید
(یا `git rm` بزنید):

1. `components/admin/admin-panel.tsx` — نسخهٔ کاملاً یتیم/duplicate در مسیر
   اشتباه. فقط `components/transport/admin-panel.tsx` واقعی است؛ هیچ‌جا
   `components/admin/admin-panel.tsx` import نمی‌شد.
2. `public/images/city-mazar.png` — عکس یتیم، هیچ‌جا استفاده نمی‌شود.

## نکتهٔ مهم دربارهٔ pnpm install

package.json دو وابستگی جدید گرفته: @floating-ui/react-dom (برای تقویم) و
sharp (برای بهینه‌سازی عکس سمت سرور). بعد از اعمال این zip، حتماً یک بار
pnpm install بزنید تا این دو نصب شوند.
