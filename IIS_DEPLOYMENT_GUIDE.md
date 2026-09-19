# راهنمای جامع راه‌اندازی و اجرای «تسک‌روز» روی وب‌سرور IIS ویندوز 🚀

این پروژه کاملاً بر مبنای **PHP** و سازگار با وب‌سرور **Microsoft IIS (Internet Information Services)** در ویندوز سرور و ویندوز ۱۰/۱۱ طراحی شده است.

---

## ۱. پیش‌نیازهای ویندوز

1. **فعال‌سازی IIS و CGI در ویندوز**:
   - به `Control Panel > Programs > Turn Windows features on or off` بروید.
   - تیک گزینه‌های زیر را بزنید:
     - `Internet Information Services`
     - `World Wide Web Services > Application Development Features > CGI` (برای اجرای FastCGI در PHP الزامی است).
     - `Common HTTP Features` (Static Content, Default Document).
   - روی OK کلیک کنید تا نصب انجام شود.

2. **نصب ماژول URL Rewrite روی IIS**:
   - فایل نصبی رسمی مایکروسافت را دانلود و نصب کنید:
     👉 [دانلود Microsoft URL Rewrite Module 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)

3. **نصب PHP روی ویندوز**:
   - پیشنهاد می‌شود نسخه **PHP 8.2 یا 8.3 Non-Thread Safe (NTS) x64** را از [windows.php.net](https://windows.php.net/download/) دانلود کرده و در مسیر `C:\PHP` اکسترکت کنید.
   - فایل `php.ini-production` را به `php.ini` تغییر نام دهید و خطوط زیر را فعال کنید (برداشتن `;` اول خط):
     ```ini
     extension_dir = "ext"
     extension=pdo_sqlite
     extension=sqlite3
     extension=mbstring
     extension=curl
     extension=fileinfo
     
     cgi.force_redirect = 0
     cgi.fix_pathinfo = 1
     fastcgi.impersonate = 1
     ```

4. **اتصال PHP به IIS (Handler Mappings)**:
   - در **IIS Manager**:
   - روی سرور یا سایت کلیک کنید و گزینه **Handler Mappings** را باز کنید.
   - در ستون سمت راست گزینه **Add Module Mapping** را بزنید:
     - Request path: `*.php`
     - Module: `FastCgiModule`
     - Executable: `C:\PHP\php-cgi.exe`
     - Name: `PHP_via_FastCGI`
   - تایید کنید.

---

## ۲. استقرار و راه‌اندازی پروژه

1. پوشه پروژه را در مسیر روت IIS قرار دهید (مثلاً `C:\inetpub\wwwroot\taskrooz`).
2. ساخت نسخه نهایی فرانت‌اند (در صورت نیاز به بیلد):
   ```bash
   npm run build
   ```
   فایل‌های داخل پوشه `dist/` در روت سایت قرار می‌گیرند.
3. فایل‌های بک‌اند و کانفیگ شامل:
   - `web.config` (قوانین URL Rewrite و امنیت فایل دیتابیس)
   - `index.php` (اجرای صفحه اصلی)
   - پوشه `api/` (شامل کدهای بک‌اند PHP و `schema.sql`)
   - پوشه `data/` (محل ذخیره پایگاه داده SQLite)

---

## ۳. تنظیم دسترسی پوشه داده‌ها (Permission)

وب‌سرور IIS برای ذخیره پایگاه‌داده SQLite نیاز به دسترسی نوشتن روی پوشه `data/` دارد:
- روی پوشه `data` در ویندوز راست کلیک کنید و وارد `Properties > Security` شوید.
- دکمه `Edit` را بزنید و سپس `Add`.
- نام کاربر `IIS_IUSRS` و همچنین `IUSR` را وارد کرده و مجوز **Modify / Write** را به آن بدهید.

---

## ۴. حساب مدیر اولیه سیستم (Admin)

پس از باز کردن سایت، دیتابیس به صورت خودکار ایجاد شده و حساب اولیه مدیر آماده ورود است:
- **نام کاربری**: `admin`
- **کلمه عبور**: `admin` (یا `admin123`)
- **نقش**: مدیر سیستم (دارای دسترسی به پنل ساخت اکانت و مشاهده تسک‌های همه کاربران)

---

## ۵. تست و بررسی در مرورگر

مرورگر خود را باز کنید و آدرس را وارد کنید:
`http://localhost/taskrooz` (یا دامنه و پورت تنظیم‌شده در IIS).
سایت با موفقیت باز شده و مستقیماً توسط PHP و IIS اجرا می‌گردد.
