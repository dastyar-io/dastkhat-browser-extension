import subprocess, pathlib
here = pathlib.Path(__file__).parent
CSS = """
@font-face{font-family:V;src:url(../../../assets/fonts/vazirmatn/Vazirmatn-Regular.woff2);font-weight:400}
@font-face{font-family:V;src:url(../../../assets/fonts/vazirmatn/Vazirmatn-Medium.woff2);font-weight:500}
@font-face{font-family:V;src:url(../../../assets/fonts/vazirmatn/Vazirmatn-Bold.woff2);font-weight:700}
*{box-sizing:border-box;margin:0}
body{width:1280px;height:800px;font-family:V,sans-serif;background:linear-gradient(135deg,#fff5f3,#fbe3df);color:#15131f;direction:rtl;overflow:hidden;position:relative}
.head{position:absolute;top:44px;right:64px;left:64px}
.head h1{font-size:44px;font-weight:700;line-height:1.3}
.head h1 b{color:#e34234}
.head p{font-size:21px;color:#555a6b;margin-top:10px}
.logo{position:absolute;top:48px;left:64px;display:flex;align-items:center;gap:10px;font-weight:700;font-size:22px;direction:ltr}
.logo img{width:40px;height:40px}
.win{position:absolute;top:210px;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(90,30,20,.22);border:1px solid #eadad7;overflow:hidden}
.bar{height:38px;background:#f4eeed;display:flex;align-items:center;gap:7px;padding:0 14px;direction:ltr}
.bar i{width:11px;height:11px;border-radius:50%;background:#d9cfcd}
.bar span{margin-left:14px;font:13px sans-serif;color:#8a8180;background:#fff;padding:4px 14px;border-radius:8px;flex:1;max-width:380px}
.body{padding:28px 32px;font-size:20px;line-height:2}
.tag{position:absolute;top:-1px;font-size:15px;font-weight:700;padding:5px 16px;border-radius:0 0 10px 10px;color:#fff}
.bad{background:#9a9aa8}.good{background:#e34234}
.ltr{direction:ltr;text-align:left;font-family:Arial,sans-serif;font-size:17px;line-height:1.9}
mark{background:#ffe27a;border-radius:4px;padding:0 3px}
.tb{display:inline-flex;gap:4px;background:#1b1816;border-radius:12px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:16px}
.tb span{color:#f2f0fa;padding:7px 14px;border-radius:8px}
.tb span.on{background:#e34234}
.card{background:#fbf6f5;border:1px solid #eadad7;border-radius:12px;padding:16px 20px;margin-top:18px;font-size:19px;line-height:1.9}
.card small{display:block;color:#e34234;font-weight:700;font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:6px}
.chip{background:#fff;border:1px solid #eadad7;border-radius:999px;padding:10px 22px;font-size:19px;font-weight:500}
"""
slides = {
"1-persian-mode": ("متن فارسی، <b>راست‌چین و خوانا</b> در هر سایت", "جهت متن و فونت فارسی را با یک کلیک درست کنید", """
<div class="win" style="right:64px;width:540px;height:400px"><div class="tag bad" style="right:24px">بدون دستخط</div><div class="bar"><i></i><i></i><i></i><span>example.com/blog</span></div>
<div class="body ltr" style="direction:ltr;text-align:left">دستخط وب را برای خواندن و نوشتن فارسی راحت می‌کند. وقتی متن فارسی در یک صفحه‌ی انگلیسی باشد، جهت و فونت آن به هم می‌ریزد (۱۲۳).<br><br>Mixed text is hard to read.</div></div>
<div class="win" style="left:64px;width:540px;height:400px;border:2px solid #e34234"><div class="tag good" style="right:24px">با دستخط</div><div class="bar"><i></i><i></i><i></i><span>example.com/blog</span></div>
<div class="body">دستخط وب را برای خواندن و نوشتن فارسی راحت می‌کند. با حالت فارسی، جهت متن راست‌چین می‌شود و فونت فارسی روی آن اعمال می‌شود (۱۲۳).<br><br><span style="direction:ltr;display:inline-block;font-family:Arial">Mixed text stays readable.</span></div></div>"""),
"2-highlights": ("متن مهم را <b>هایلایت کنید</b>", "هایلایت‌ها ذخیره می‌شوند و هنگام بازگشت به صفحه سر جای خود هستند", """
<div class="win" style="right:64px;left:64px;height:400px"><div class="bar"><i></i><i></i><i></i><span>example.com/article</span></div>
<div class="body">یکی از مهم‌ترین اصول طراحی برای زبان فارسی، <mark>توجه به جهت متن و انتخاب فونتی است که در اندازه‌های کوچک هم خوانا بماند.</mark> بسیاری از سایت‌های انگلیسی این موضوع را در نظر نمی‌گیرند و متن فارسی در آن‌ها ناخوانا می‌شود.<br><br>
<div class="tb" style="margin-right:120px"><span class="on">هایلایت</span><span>بهبود</span><span>ترجمه</span><span>خلاصه</span><span>دستور</span></div><br>
در ادامه‌ی مقاله، <mark style="background:#a7e8c3">راهکارهای عملی</mark> برای بهبود تجربه‌ی خواندن بررسی می‌شود.</div></div>"""),
"3-ai-helper": ("دستیار هوش مصنوعی <b>برای متن فارسی</b>", "متن را انتخاب کنید؛ بهبود، ترجمه، خلاصه یا اصلاح دستور", """
<div class="win" style="right:64px;left:64px;height:400px"><div class="bar"><i></i><i></i><i></i><span>example.com/draft</span></div>
<div class="body"><mark style="background:#cfe0ff">من دیروز رفتم به بازار و خیلی چیز ها خریدم که لازم نبود.</mark><br>
<div class="tb"><span>هایلایت</span><span class="on">بهبود</span><span>ترجمه</span><span>خلاصه</span><span>دستور</span></div>
<div class="card"><small>نتیجه‌ی بهبود</small>دیروز به بازار رفتم و چیزهای زیادی خریدم که اصلاً لازم نبودند.</div></div></div>"""),
"4-private": ("با کلید API <b>خودتان</b>، بدون حساب و ردیابی", "متن فقط با کلیک شما و مستقیم به ارائه‌دهنده‌ی انتخابی شما ارسال می‌شود", """
<div class="win" style="right:64px;left:64px;height:400px"><div class="bar"><i></i><i></i><i></i><span>تنظیمات دستخط</span></div>
<div class="body"><div style="font-weight:700;margin-bottom:8px">ارائه‌دهنده‌ی هوش مصنوعی</div>
<div class="chips"><div class="chip" style="background:#e34234;color:#fff;border-color:#e34234">Anthropic</div><div class="chip">OpenAI</div><div class="chip">OpenRouter</div><div class="chip">Gemini</div><div class="chip">DeepSeek</div><div class="chip">Groq</div><div class="chip">Ollama</div><div class="chip">OpenAI-compatible</div></div>
<div class="card"><small>حریم خصوصی</small>بدون حساب کاربری · بدون ابزار تحلیل · کلیدها فقط روی دستگاه شما · متن‌باز (MIT)</div></div></div>"""),
}
for name,(h,p,body) in slides.items():
    html=f'<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><style>{CSS}</style><body><div class="logo"><img src="../../../assets/icons/icon128.png">Dastkhat</div><div class="head"><h1>{h}</h1><p>{p}</p></div>{body}</body></html>'
    f=here/f"{name}.html"; f.write_text(html,encoding="utf-8")
    out=here.parent.parent/"screenshots"/f"{name}.png"
    subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1","--window-size=1280,800","--allow-file-access-from-files",f"--screenshot={out}",f"file://{f}"],check=True,capture_output=True)
