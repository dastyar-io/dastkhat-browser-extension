<div align="center">

<img src="assets/icons/icon128.png" width="96" alt="لوگوی دستخط" />

# دستخط (Dastkhat)

**دستیار خواندن و نوشتن فارسی برای کروم، اج و فایرفاکس**
راست‌چین و فونت فارسی در هر سایت، هایلایت متن، و بازنویسی و ترجمه با هوش مصنوعی و کلید API خودتان.

[![CI](https://github.com/dastyar-io/dastkhat-browser-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/dastyar-io/dastkhat-browser-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-green.svg)](src/manifest.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](README.en.md) · [حریم خصوصی](PRIVACY.md) · [مشارکت](CONTRIBUTING.md) · [تغییرات](CHANGELOG.md)

</div>

<div dir="rtl">

## امکانات

- **حالت فارسی:** راست‌چین‌کردن خودکار و اعمال فونت فارسی روی صفحه‌ها و فیلدهای متنی. برای هر صفحه به‌صورت جداگانه یا برای دامنه‌های دلخواه (مثل ChatGPT، Claude و Gemini) خودکار فعال می‌شود.
- **هایلایت:** متن را انتخاب و هایلایت کنید؛ با بازگشت به صفحه سر جای خودش است.
- **دستیار هوش مصنوعی:** بهبود، ترجمه، خلاصه‌سازی و اصلاح دستور متن انتخاب‌شده یا متن داخل فیلدها، با کلید خودتان (Anthropic، OpenAI، OpenRouter، Gemini، DeepSeek، Groq، Ollama یا هر سرویس سازگار با OpenAI).
- **حریم خصوصی:** بدون ردیابی، بدون حساب کاربری و بدون کد راه‌دور. جزئیات در [PRIVACY.md](PRIVACY.md).

## نصب

- فروشگاه کروم، افزونه‌های اج و افزونه‌های فایرفاکس: _پیوندها پس از تأیید فروشگاه‌ها اضافه می‌شود._
- از نسخه‌ی منتشرشده: فایل zip مرورگر خودتان را از بخش [Releases](https://github.com/dastyar-io/dastkhat-browser-extension/releases) بگیرید.
- از روی سورس: بخش [توسعه](#توسعه) را ببینید.

بعد از نصب، روی آیکون دستخط بزنید و از تنظیمات، بخش هوش مصنوعی، ارائه‌دهنده، آدرس پایه، کلید API و مدل را وارد کنید.

## توسعه

</div>

```bash
git clone https://github.com/dastyar-io/dastkhat-browser-extension.git
cd dastkhat-browser-extension
npm run build            # all targets + zips in dist/
npm run build:firefox    # a single target
```

<div dir="rtl">

پروژه وابستگی ندارد (فقط Node نسخه‌ی ۱۸ به بالا و دستور `zip`). برای کروم و اج پوشه‌ی `dist/chrome` را با «Load unpacked» و برای فایرفاکس فایل `dist/firefox/manifest.json` را با «Load Temporary Add-on» بارگذاری کنید.

### ساختار پروژه

</div>

```
src/
  manifest.json      extension manifest (source of truth for all targets)
  background/        service worker: calls the AI provider
  content/           content script and styles: Persian mode, highlights, toolbar
  popup/             toolbar popup
  options/           settings page
  shared/            shared code: providers, defaults, font catalog
assets/
  icons/             extension icons and logo
  fonts/             bundled open-licensed fonts
scripts/             build and font-bundling scripts
store/               store listing, screenshots, promo tiles
docs/                architecture notes
.github/             CI, release, issue and PR templates
```

<div dir="rtl">

فرایند ساخت، پوشه‌های `src/` و `assets/` را برای هر مرورگر در یک بسته‌ی تخت داخل `dist/` جمع می‌کند. توضیح بیشتر در [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) و مراحل انتشار در [store/LISTING.md](store/LISTING.md) است.

## مشارکت

issue و pull request به فارسی یا انگلیسی خوش‌آمد است. پیش از شروع [CONTRIBUTING.md](CONTRIBUTING.md) و [آیین‌نامه‌ی رفتار](CODE_OF_CONDUCT.md) را بخوانید. آسیب‌پذیری‌ها را طبق [SECURITY.md](SECURITY.md) به‌صورت خصوصی گزارش کنید.

## مجوز

کد پروژه با [مجوز MIT](LICENSE) منتشر شده است. فونت‌های همراه افزونه مجوز آزاد خودشان را دارند؛ فهرستشان در [assets/fonts/README.md](assets/fonts/README.md) و [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) آمده است.

## تاریخچه‌ی ستاره‌ها

<a href="https://www.star-history.com/?repos=dastyar-io%2Fdastkhat-browser-extension&type=timeline&logscale=&releases=&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=dastyar-io/dastkhat-browser-extension&type=timeline&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=dastyar-io/dastkhat-browser-extension&type=timeline&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=dastyar-io/dastkhat-browser-extension&type=timeline&legend=bottom-right" />
 </picture>
</a>

</div>
