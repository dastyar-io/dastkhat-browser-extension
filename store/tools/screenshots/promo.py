import subprocess, pathlib
here = pathlib.Path(__file__).parent
CSS = """
@font-face{font-family:V;src:url(../../../assets/fonts/vazirmatn/Vazirmatn-Medium.woff2);font-weight:500}
@font-face{font-family:V;src:url(../../../assets/fonts/vazirmatn/Vazirmatn-Bold.woff2);font-weight:700}
html{background:#fbe3df}*{box-sizing:border-box;margin:0}
body{width:%(w)dpx;height:%(h)dpx;font-family:V,sans-serif;background:linear-gradient(135deg,#fff5f3,#fbd9d4);color:#15131f;overflow:hidden;position:absolute;left:0;top:0;display:flex;direction:ltr;align-items:center;justify-content:center;gap:%(gap)dpx}
.t{text-align:right;direction:rtl;min-width:0}
h1{font-size:%(h1)dpx;font-weight:700;line-height:1.35}
h1 b{color:#e34234}
p{font-size:%(p)dpx;color:#555a6b;margin-top:%(pm)dpx;line-height:1.7}
img{flex-shrink:0;width:%(img)dpx;height:%(img)dpx;filter:drop-shadow(0 12px 24px rgba(200,55,42,.35))}
.en{direction:ltr;font-weight:700;font-size:%(en)dpx;margin-top:%(pm)dpx;color:#e34234;text-align:right}
"""
def make(name,w,h,**k):
    html=f'<!doctype html><meta charset="utf-8"><style>{CSS % dict(w=w,h=h,**k)}</style><body><div class="t"><h1>{k["title"]}</h1>{k["sub"]}</div><img src="../../../assets/icons/icon128.png"></body>'
    f=here/f"{name}.html"; f.write_text(html,encoding="utf-8")
    out=here.parent.parent/"screenshots"/f"{name}.png"
    subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1",f"--window-size={max(w,800)},{max(h,600)}","--allow-file-access-from-files",f"--screenshot={out}",f"file://{f}"],check=True,capture_output=True)
    from PIL import Image
    Image.open(out).convert("RGB").crop((0,0,w,h)).save(out)
make("promo-small-440x280",440,280,gap=12,h1=25,p=13,pm=6,img=72,en=15,
     title="دستخط<br><b>فارسی‌نویسی راحت‌تر</b>",sub='<p>راست‌چین، فونت فارسی، هایلایت و هوش مصنوعی</p>')
make("promo-marquee-1400x560",1400,560,gap=60,h1=64,p=28,pm=16,img=200,en=26,
     title="متن فارسی در هر سایت،<br><b>راست‌چین و خوانا</b>",sub='<p>فونت فارسی · هایلایت · بهبود و ترجمه با هوش مصنوعی</p><div class="en">Dastkhat</div>')
