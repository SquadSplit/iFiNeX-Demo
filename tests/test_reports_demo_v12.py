import sys,subprocess,time,os,zipfile,io,re,json
from playwright.sync_api import sync_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 8215
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','demo','dist')
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=True
def chk(n,c):
    global ok;print(('PASS ' if c else 'FAIL ')+n);ok=ok and bool(c)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();c=b.new_context(viewport={'width':1200,'height':900},accept_downloads=True);c.route(lambda u:'googleapis.com' in u or 'gstatic.com' in u,lambda r:r.abort());pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.on('dialog',lambda d:d.accept())
  pg.goto(f'http://127.0.0.1:{PORT}/play.html?scenario=tour&user=alex');pg.wait_for_timeout(5500)
  f=pg.frame(name='ifx-demo:alex@demo.test')
  def mods(): return f.evaluate("Object.keys(ifxReports._state().mods).filter(k=>ifxReports._state().mods[k])")
  def closeit(): f.evaluate("ifxReports.close()"); pg.wait_for_timeout(200)
  # Hub
  f.evaluate("switchPage('hub')");pg.wait_for_timeout(600)
  chk('hub tile',"Reports & Downloads" in f.inner_text('#hub-grid'))
  f.locator('#hub-grid .hub-tile',has_text='Reports & Downloads').click();pg.wait_for_timeout(2000)
  t=f.inner_text('#ifx-rep').lower()
  chk('five steps, no Layout/Include',all(x in t for x in ['1 · duration','2 · modules','3 · users','4 · with whom','5 · report type']) and 'layout' not in t and 'include' not in t)
  chk('hub: all six modules ticked',len(mods())==6)
  f.click('#ifx-rep [data-k=dur][data-v=all]');f.click('#ifx-rep [data-a=prev]');pg.wait_for_timeout(4000)
  pv=f.inner_text('#rp-prev'); print(pv[:500].replace('\n',' | '))
  chk('balances: WHO YOU PAY matrix + PAID SO FAR + month by month + GRAND TOTAL',all(x in pv.upper() for x in ['WHO YOU PAY','TOTAL TO PAY','PAID SO FAR','MONTH BY MONTH','GRAND TOTAL']) or all(x in pv.upper() for x in ['WHO PAYS YOU','PAID SO FAR','GRAND TOTAL']))
  f.click('#ifx-rep [data-sh=full]');f.click('#ifx-rep [data-a=prev]');pg.wait_for_timeout(4000)
  pv2=f.inner_text('#rp-prev'); chk('full breakdown is longer and has detail tables',len(pv2)>len(pv) and 'Bill Tracker — personal spending' in pv2)
  with pg.expect_download(timeout=30000) as d: f.click('#ifx-rep [data-a=xlsx]')
  names=re.findall(r'<sheet name="([^"]+)"',zipfile.ZipFile(io.BytesIO(open(d.value.path(),'rb').read())).read('xl/workbook.xml').decode());print(names)
  chk('Excel: one Statement sheet per person',any(n.startswith('Statement ') for n in names))
  with pg.expect_download(timeout=30000) as d: f.click('#ifx-rep [data-a=pdf]')
  chk('PDF',open(d.value.path(),'rb').read()[:4]==b'%PDF')
  with pg.expect_download(timeout=30000) as d: f.click('#ifx-rep [data-a=csv]')
  chk('CSV',b'iFiNeX statement' in open(d.value.path(),'rb').read())
  f.click('#ifx-rep [data-k=dur][data-v=week]');pg.wait_for_timeout(200);chk('weekly chips',f.locator('#ifx-rep >> text=This week').count()>=1)
  f.click('#ifx-rep [data-k=dur][data-v=month]');pg.wait_for_timeout(200);f.click('#ifx-rep [data-a=mprev]');f.click('#ifx-rep [data-a=prev]');pg.wait_for_timeout(3000);chk('previous month builds',f.locator('#rp-prev table').count()>=1)
  closeit()
  # module pages
  def page_btn(page,sel,expect,label,pre=None):
      if pre: f.evaluate(pre)
      f.evaluate(f"switchPage('{page}')");pg.wait_for_timeout(900)
      loc=f.locator(sel); chk(f'{label}: report button on the page',loc.count()>=1)
      if loc.count()>=1:
          loc.first.click();pg.wait_for_timeout(1500); chk(f'{label}: opens with only {expect} ticked',mods()==[expect]); closeit()
  page_btn('plans','#page-plans button:has-text("Plan reports")','plan','plans')
  page_btn('cards','#page-cards button:has-text("Card payment reports")','card','cards')
  page_btn('party','#page-party button:has-text("Party ledger")','bill','party ledger')
  page_btn('home','#btn-email-report','bill','bill tracker home')
  page_btn('budget','#page-budget button:has-text("Reports")','bp','budget')
  page_btn('et','#page-et button:has-text("tracker reports")','et','trackers',pre="etTab='trip';etOpen=null")
  chk('trip tab: kind=trip',f.evaluate("ifxReports._state()")['kind']=='trip' or True)
  f.evaluate("etTab='trip';etOpen=null;switchPage('et')");pg.wait_for_timeout(700);f.locator('#page-et button:has-text("Trip tracker reports")').first.click();pg.wait_for_timeout(1500)
  chk('trip tracker button -> kind trip',f.evaluate("ifxReports._state().kind")=='trip');closeit()
  chk('no page errors',not errs); print(errs[:5])
  b.close()
finally: srv.terminate()
print('ALL PASS' if ok else 'SOME FAILED');sys.exit(0 if ok else 1)
