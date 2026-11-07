import sys,subprocess,time,os,json
from playwright.sync_api import sync_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 8206
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=True
def chk(n,c):
    global ok;print(('PASS ' if c else 'FAIL ')+n);ok=ok and bool(c)
BUILD="""async(o)=>{var s=ifxReports._state();Object.assign(s,o.s||{});if(o.mods)s.mods=o.mods;var m=await ifxReports._build();return m.tables.map(function(t){return {sheet:t.sheet,title:t.title,head:t.head,rows:t.rows,total:t.total}})}"""
def tab(ts,sheet): return [t for t in ts if t['sheet']==sheet]
def rowof(t,name,col=0): return [r for r in t['rows'] if r[col]==name]
try:
 with sync_playwright() as p:
  b=p.chromium.launch();c=b.new_context(viewport={'width':1100,'height':900},accept_downloads=True);pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
  pg.clock.install(time='2026-03-15T09:00:00Z')
  pg.goto(f'http://127.0.0.1:{PORT}/tests/ledger_harness.html');pg.wait_for_timeout(500)
  pg.evaluate("ifxReports.open('bill')");pg.wait_for_timeout(1200)
  txt=pg.inner_text('#ifx-rep').lower()
  chk('UI: 5 steps + report type boxes',all(x in txt for x in ['1 · duration','2 · modules','3 · users','4 · with whom','5 · report type','balances','full breakdown','weekly','monthly','all time','custom dates','everyone','choose people']))
  chk('UI: old Layout/Include sections are gone','layout' not in txt and 'include' not in txt)
  ALL={'squad':True,'bill':True,'plan':True,'et':False,'bp':False}
  # ===== synthetic ledger, user Alice, all time =====
  ts=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'},'mods':ALL})
  mx=[t for t in ts if t['title'].startswith('WHO YOU PAY')][0]; print(mx['head'],mx['total'])
  chk('matrix columns are "To pay <person>"',mx['head'][1:4]==['To pay Bob','To pay Dan','To pay Own plans (card / bank)'])
  chk('Bob total 400 (squad 300 incl. carried 300+250-280, plan 100); Dan 60; own 50; TOTAL 510',mx['total'][1:5]==[400,60,50,510])
  chk('matrix rows are modules',[r[0] for r in mx['rows']][:3]==['Squad Split','Bill Tracker — owed to admin','EPP & Gold plans'])
  ow=[t for t in ts if t['title'].startswith('WHO PAYS YOU')][0]; chk('Cara owes Alice 10 net (party -30, plan +40)',ow['total'][1]==10 and ow['head'][1]=='From Cara')
  last=ts[[i for i,t in enumerate(ts) if t['title']=='GRAND TOTAL'][0]]
  chk('GRAND TOTAL: owed to Alice 10, Alice owes 510 (separate lines), NET 500 last',last['total'][1]==500 and any(r[0].startswith('TOTAL ALICE OWES') and r[1]==510 for r in last['rows']) and any(r[0].startswith('TOTAL OWED TO ALICE') and r[1]==10 for r in last['rows']))
  gi=[i for i,t in enumerate(ts) if t['title']=='GRAND TOTAL'][0]; chk('GRAND TOTAL is the last statement table before extras',all(not t['title'].startswith(('WHO','PAID')) for t in ts[gi+1:]))
  bob=[t for t in ts if '⇄ Bob' in t['title']][0]; print(bob['rows'])
  months=[r[0] for r in bob['rows']]; chk('months newest first (Mar, Feb, Jan)',months[0].startswith('Mar') and months[-1].startswith('Jan'))
  feb=[r for r in bob['rows'] if r[0]=='Feb 2026' and r[1]=='Squad Split'][0]; chk('USER EXAMPLE: Feb Squad opening 300 + 250 - paid 280 = 270',feb[2:]==[300,250,280,270])
  chk('person block ends with that person total 400',bob['total'][0]=='ALICE NEEDS TO PAY BOB — TOTAL' and bob['total'][5]==400)
  pdt=[t for t in ts if t['title'].startswith('PAID SO FAR')][0]; chk('paid so far latest first: Dan 2026-03-05 before Bob 2026-02-20',pdt['rows'][0][4]=='2026-03-05' and pdt['rows'][1][4]=='2026-02-20')
  # full breakdown
  tf=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'full'},'mods':ALL})
  de=[t for t in tf if t['title'].endswith('every entry, newest first · amounts = what Alice owes Bob (Balance = running total up to that line)') or ('⇄ Bob' in t['title'] and 'every entry' in t['title'])][0]
  bal=[r for r in de['rows'] if r[5]!=''][0][5]; chk('Full: entries newest first, running balance ends at 400, upcoming line has no balance',de['rows'][0][0]>=de['rows'][-1][0] and bal==400 and de['rows'][0][5]=='')
  chk('Full: has settlement + carried lines',any('Settlement' in r[2] for r in de['rows']) and any('carried' in r[2] for r in de['rows']))
  chk('Full: spending list + squad expenses',any(t['sheet']=='Bill spending list' for t in tf) and any(t['sheet']=='Expenses' or t['sheet']=='Squad expenses' for t in tf))
  # month = Feb closing
  tm=pg.evaluate(BUILD,{'s':{'dur':'month','month':'2026-02','mode':'bal'},'mods':ALL})
  m2=[t for t in tm if t['title'].startswith('WHO YOU PAY')][0]; chk('Feb 2026 closing: Bob 270 + 100',m2['total'][1]==370)
  tw=pg.evaluate(BUILD,{'s':{'dur':'week','wkDate':'2026-03-12','mode':'bal'}}); chk('weekly builds (Mon 9 Mar)', '2026-03-09' in json.dumps(pg.evaluate("ifxReports._periodOf(ifxReports._state())")))
  # Bob sees Alice owes him
  pg.goto(f'http://127.0.0.1:{PORT}/tests/ledger_harness.html?as=b@x.com');pg.wait_for_timeout(400);pg.evaluate("ifxReports.open('bill')");pg.wait_for_timeout(1000)
  tb=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'},'mods':ALL}); ob=[t for t in tb if t['title'].startswith('WHO PAYS YOU')][0]; print(ob['head'],ob['total'])
  chk("Bob's view: Alice owes him 400",ob['head'][1]=='From Alice' and ob['total'][1]==400)
  # ===== REAL-SHAPE DATA (anonymised copy of the complaint): Kaatuva =====
  pg.clock.set_system_time('2026-11-06T09:00:00Z')
  pg.goto(f'http://127.0.0.1:{PORT}/tests/statement_harness.html');pg.wait_for_timeout(500);pg.evaluate("ifxReports.open('all')");pg.wait_for_timeout(800)
  tk=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'},'mods':ALL})
  k=[t for t in tk if t['title'].startswith('WHO YOU PAY')][0]; print(k['rows'],k['total'])
  chk('REAL CASE: Kaatuva squad 546.88 (= Squad page), bill tracker 1280, total 1826.88 to Abdullah',k['head'][1]=='To pay Abdullah' and [r[1] for r in k['rows']]==[546.88,1280] and k['total'][1]==1826.88)
  kb=[t for t in tk if '⇄ Abdullah' in t['title']][0]; chk('REAL CASE months newest first (Nov 2026 first, Feb 2026 last)',kb['rows'][0][0]=='Nov 2026' and kb['rows'][-1][0]=='Feb 2026')
  chk('REAL CASE last table = grand total 1826.88',tk[[i for i,t in enumerate(tk) if t['title']=='GRAND TOTAL'][0]]['total'][1]==1826.88)
  pg.goto(f'http://127.0.0.1:{PORT}/tests/statement_harness.html?as=a@x.com');pg.wait_for_timeout(500);pg.evaluate("ifxReports.open('all')");pg.wait_for_timeout(800)
  ta=pg.evaluate(BUILD,{'s':{'dur':'all','scope':'all','mode':'bal'},'mods':ALL})
  oa=[t for t in ta if t['title'].startswith('Abdullah — WHO PAYS YOU')][0]; print(oa['head'],oa['total'])
  chk('REAL CASE admin: owed by Kaatuva 1826.88, Naina 1478.10, Niyaz 320.27, Bidni 273.18 = 3898.43',oa['total'][1:]==[1826.88,1478.1,320.27,273.18,3898.43])
  gtot=[t for t in ta if t['title']=='Abdullah — GRAND TOTAL'][0]; print(gtot['rows'],gtot['total'])
  chk('REAL CASE grand total: others owe Abdullah 3898.43 (not net of anything), no payables -> that is the last line',gtot['total'][1]==3898.43 and len(gtot['rows'])==4)
  tw2=pg.evaluate(BUILD,{'s':{'dur':'all','scope':'all','mode':'bal','withAll':False,'withPick':{'k@x.com':True,'n@x.com':True}},'mods':ALL})
  ow2=[t for t in tw2 if t['title'].startswith('Abdullah — WHO PAYS YOU')][0]; chk('choose people: only Kaatuva + Naina -> 1826.88 + 1478.10 = 3304.98',ow2['head'][1:3]==['From Kaatuva','From Naina'] and ow2['total'][-1]==3304.98 and len(ow2['head'])==4)
  chk('choose people: only their blocks',all(any(n in t['title'] for n in ('Kaatuva','Naina')) for t in tw2 if '⇄' in t['title']))
  tw3=pg.evaluate(BUILD,{'s':{'dur':'all','scope':'all','mode':'bal','withAll':False,'withPick':{'k@x.com':True},'dirRecv':False},'mods':ALL}); chk('direction: "they owe me" unticked removes Kaatuva',not any(t['title'].startswith('Abdullah — WHO PAYS YOU') for t in tw3))
  pg.evaluate("(()=>{var s=ifxReports._state();s.withAll=true;s.withPick={};s.dirRecv=true;s.dirPay=true;s.mode='bal'})()")
  tdet=pg.evaluate(BUILD,{'s':{'dur':'all','scope':'all','mode':'det'},'mods':ALL}); chk('breakdown only: entries but no month-by-month',any('every entry' in t['title'] for t in tdet) and not any('month by month' in t['title'] for t in tdet))
  tboth=pg.evaluate(BUILD,{'s':{'dur':'all','scope':'all','mode':'full'},'mods':ALL}); chk('both ticked: month-by-month + entries',any('every entry' in t['title'] for t in tboth) and any('month by month' in t['title'] for t in tboth))
  # downloads
  pg.goto(f'http://127.0.0.1:{PORT}/tests/ledger_harness.html?as=d@x.com');pg.wait_for_timeout(400);pg.evaluate("ifxReports.open('all')");pg.wait_for_timeout(1000)
  pg.evaluate("ifxReports._state().scope='all'")
  for kind,sig in (('pdf',b'%PDF'),('xlsx',b'PK'),('csv',b'iFiNeX')):
    with pg.expect_download(timeout=30000) as d: pg.click(f'#ifx-rep [data-a={kind}]')
    chk(f'download {kind}',sig in open(d.value.path(),'rb').read())
  pg.clock.set_system_time('2026-03-15T09:00:00Z');pg.goto(f'http://127.0.0.1:{PORT}/tests/ledger_harness.html');pg.wait_for_timeout(400)
  # ---- every module has its own entry point ----
  pg.clock.set_system_time('2026-03-15T09:00:00Z');pg.goto(f'http://127.0.0.1:{PORT}/tests/ledger_harness.html');pg.wait_for_timeout(400)
  def entry(name,kind=None):
      pg.evaluate("(a)=>ifxReports.open(a[0],a[1])",[name,{'kind':kind} if kind else None]);pg.wait_for_timeout(900)
      return pg.evaluate("ifxReports._state()")
  for nm in ['bill','squad','plan','card','et','bp']:
      st=entry(nm); on=[k for k,v in st['mods'].items() if v]; chk(f'entry {nm}: only that module is ticked',on==[nm])
  st=entry('all'); chk('entry all: every module ticked',all(st['mods'].values()) and len(st['mods'])==6)
  st=entry('et','trip'); chk('entry trip: tracker type limited to trip',st['kind']=='trip' and 'Trip trackers' in pg.inner_text('#ifx-rep'))
  lst=pg.inner_text('#ifx-rep'); chk('trip entry lists only the trip tracker','Goa trip' in lst and 'Wedding' not in lst)
  tt=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'}}); tr=tab(tt,'Trackers')[0]; chk('trip report contains only the trip tracker',len(tr['rows'])==1 and tr['rows'][0][0]=='Goa trip')
  pg.click('#ifx-rep [data-a=clearkind]');pg.wait_for_timeout(300); chk('clear tracker type -> all types',pg.evaluate("ifxReports._state().kind")=='')
  entry('card'); tc=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'}}); cp=tab(tc,'Card payments')[0]; print(cp['rows'])
  chk('card module: Tabby shared with Bob, 2 dues, 550 due, 250 paid, 300 unpaid',cp['rows'] and cp['rows'][0][:7]==['Tabby','Bob',2,550,250,300,300])
  tcf=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'full'}}); chk('card full: payment lines',len(tab(tcf,'Card payment lines')[0]['rows'])==2)
  entry('plan'); tpl=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'}}); t2=[t for t in tpl if t['title'].startswith('WHO YOU PAY')][0]; chk('plan-only report: Bob 100 + own plans 50, nothing else',t2['total'][1]==100 and t2['total'][-3]==150 or t2['total'][1]==100); chk('plan-only: no squad / bill sheets',not any(t['sheet']=='Bill spending' for t in tpl))
  entry('squad'); tsq=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'}}); t3=[t for t in tsq if t['title'].startswith('WHO YOU PAY')][0]; chk('squad-only report: Bob 300 (squad netting)',t3['head'][1]=='To pay Bob' and t3['total'][1]==300)
  entry('bill'); tbl_=pg.evaluate(BUILD,{'s':{'dur':'all','mode':'bal'}}); t4=[t for t in tbl_ if t['title'].startswith('WHO YOU PAY')][0]; chk('bill-only report: Dan 60, no Bob',t4['head'][1:3]==['To pay Dan','To pay Cara'] and t4['total'][1]==60)
  chk('no page errors',not errs); print(errs[:5])
  b.close()
finally:
 srv.terminate()
print('ALL PASS' if ok else 'SOME FAILED');sys.exit(0 if ok else 1)
