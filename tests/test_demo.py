import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8181
root = os.path.join(os.path.dirname(__file__), '..', 'demo', 'dist')
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', root], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); ok = True
def chk(n, c):
    global ok; print(('PASS ' if c else 'FAIL ') + n); ok = ok and c
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1500, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/both.html'); pg.wait_for_timeout(4000)
        fd = pg.frame(name='ifx-demo:alex@demo.test'); fp = pg.frame(name='ifx-demo:priya@demo.test')
        chk('desktop frame is Alex', fd is not None and 'Alex' in fd.inner_text('body'))
        chk('phone frame is Priya', fp is not None and 'Priya' in fp.inner_text('body'))
        pg.click('#s3'); pg.wait_for_timeout(1500)
        chk('realtime feed shows events', 'DELETE bill_owed' in pg.inner_text('#feed'))
        chk('Priya got a notification row', pg.evaluate("window.__IFX_DEMO.db.bill_notifications.some(n=>n.recipient_email==='priya@demo.test')"))
        pg.screenshot(path=os.path.join(root, '..', 'demo-screenshot.png'))
        chk('no page errors', not errs)
        if errs: print(errs[:3])
        b.close()
finally:
    srv.terminate()
sys.exit(0 if ok else 1)
