import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8185
root = os.path.join(os.path.dirname(__file__), '..', 'demo', 'dist')
shots = os.path.join(os.path.dirname(__file__), '..', 'docs', 'img'); os.makedirs(shots, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); ok = True
def chk(n, c):
    global ok; print(('PASS ' if c else 'FAIL ') + n); ok = ok and c
def fr(pg): return pg.frame_locator('#fr')
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        pg = b.new_page(viewport={'width': 1300, 'height': 820}); pg.on('pageerror', lambda e: errs.append(str(e)))
        base = f'http://127.0.0.1:{PORT}/'
        pg.goto(base); chk('chooser shows Website + Mobile options', pg.locator('a.opt').count() == 2)
        pg.screenshot(path=os.path.join(shots, 'demo-choose.png'))
        pg.click('a.opt[href="web.html"]'); pg.wait_for_timeout(3500)
        chk('Website option -> web.html', pg.url.endswith('web.html'))
        txt = pg.frame(name='ifx-demo:alex@demo.test').inner_text('body') if pg.frame(name='ifx-demo:alex@demo.test') else ''
        chk('web demo runs as Alex', 'Alex' in txt)
        pg.screenshot(path=os.path.join(shots, 'demo-web.png'))
        pg.click('#mod button[data-v="squad.html"]'); pg.wait_for_timeout(3500)
        f = pg.frame(name='ifx-demo:alex@demo.test'); t = f.inner_text('body') if f else ''
        chk('Squad Split loads with squad + expenses', 'Weekend Trip' in t and 'BBQ dinner' in t)
        pg.screenshot(path=os.path.join(shots, 'demo-squad.png'))
        pg.click('#usr button[data-v="priya"]'); pg.wait_for_timeout(3500)
        f = pg.frame(name='ifx-demo:priya@demo.test'); chk('user switch -> Priya frame', f is not None and 'Priya' in f.inner_text('body'))
        pg.goto(base); pg.click('a.opt[href="mobile.html"]'); pg.wait_for_timeout(3500)
        chk('Mobile option -> mobile.html', pg.url.endswith('mobile.html'))
        f = pg.frame(name='ifx-demo:priya@demo.test'); chk('mobile demo runs as Priya', f is not None and 'Priya' in f.inner_text('body'))
        pg.screenshot(path=os.path.join(shots, 'demo-mobile.png'))
        ph = b.new_page(viewport={'width': 390, 'height': 800}); ph.on('pageerror', lambda e: errs.append(str(e)))
        ph.goto(base); chk('phone: options stacked', ph.locator('a.opt').nth(1).bounding_box()['y'] > ph.locator('a.opt').nth(0).bounding_box()['y'] + 100)
        ph.click('a.opt[href="mobile.html"]'); ph.wait_for_timeout(3500)
        w = ph.evaluate("document.querySelector('#fr').getBoundingClientRect().width"); chk('phone: app frame is full width (%d)' % w, w >= 385)
        chk('phone: no horizontal scroll', ph.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
        ph.screenshot(path=os.path.join(shots, 'demo-mobile-phone.png'))
        chk('no page errors', not errs)
        if errs: print(errs[:4])
        b.close()
finally:
    srv.terminate()
sys.exit(0 if ok else 1)
