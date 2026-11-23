/* iFiNeX DEMO ONLY (v14.5) — simulated Android phone for "Check for updates".
   The REAL ifinex-update.js runs unchanged (same dialog, same texts, same button order). Only the native plugin IfinexUpdater is faked, and only while the dialog opens,
   so no other demo code ever thinks it runs inside the Android app. Fake: GitHub release, the download, Android's "Install unknown apps" screen, the Android installer and the browser.
   Real app: direct "Download & install" -> "Install now" -> Android installer; "Download in browser instead"; "Later". Nothing here is downloaded or installed. NOT shipped in the real app/website. */
(function (W, D) {
  'use strict';
  if (!W.ifxUpdate || W.ifxDemoUpd) return;
  var realOpen = W.ifxUpdate.open, realQuiet = W.ifxUpdate.quiet;
  var NOW = Math.floor(Date.now() / 60000);
  var st = { installed: false, perm: false, listeners: [] };
  var OLD = { name: '7.3.0', code: NOW - 4320 }, NEW = { name: '7.4.0', code: NOW - 20 };
  var edition = /app-standalone/.test(W.location.pathname) ? 'standalone' : 'server';
  var NOTES = 'iFiNeX v14.4 (app 7.4.0)\n• Update fix: "Download & install (direct, inside the app)" works again, then "Install now".\n• Open-source edition, neutral build workflow.\n• Same signing key: installs over the old app, your data stays.';

  function el(t, css, txt) { var n = D.createElement(t); if (css) n.style.cssText = css; if (txt != null) n.textContent = txt; return n; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function emit(done, total) { st.listeners.slice().forEach(function (f) { try { f({ done: done, total: total }); } catch (e) { } }); }

  /* ---- fake Android screens (full-screen overlays) ---- */
  function screen(title) {
    var o = el('div', 'position:fixed;inset:0;z-index:10050;background:#f3f4f6;color:#111;display:flex;flex-direction:column;font-family:system-ui,Roboto,Arial,sans-serif;');
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.appendChild(el('div', 'background:#0b57d0;color:#fff;padding:14px 16px;font-weight:700;font-size:1.02rem;', title));
    var body = el('div', 'flex:1;padding:18px 16px;overflow:auto;max-width:520px;width:100%;margin:0 auto;box-sizing:border-box;'); o.appendChild(body);
    o.appendChild(el('div', 'padding:8px;text-align:center;font-size:.68rem;color:#6b7280;background:#e5e7eb;', 'DEMO — simulated Android screen. Nothing is installed.'));
    D.body.appendChild(o); return { o: o, body: body, close: function () { o.remove(); } };
  }
  function abtn(label, fn, main) { var b = el('button', 'padding:12px 18px;border-radius:22px;border:' + (main ? '0' : '1px solid #9ca3af') + ';background:' + (main ? '#0b57d0' : '#fff') + ';color:' + (main ? '#fff' : '#0b57d0') + ';font-weight:700;font-size:.9rem;cursor:pointer;margin:6px 8px 0 0;', label); b.addEventListener('click', fn); return b; }

  function permScreen() {
    var s = screen('Install unknown apps'); var on = false;
    s.body.appendChild(el('div', 'font-weight:700;font-size:1.05rem;margin-bottom:4px;', 'iFiNeX'));
    s.body.appendChild(el('div', 'font-size:.82rem;color:#4b5563;margin-bottom:18px;', 'Version ' + OLD.name));
    var row = el('div', 'display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:14px;padding:14px;');
    row.appendChild(el('span', 'font-size:.95rem;', 'Allow from this source'));
    var sw = el('button', 'width:52px;height:30px;border-radius:15px;border:0;background:#9ca3af;position:relative;cursor:pointer;'); sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', 'false'); sw.setAttribute('aria-label', 'Allow from this source');
    var knob = el('span', 'position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .15s;'); sw.appendChild(knob);
    sw.addEventListener('click', function () { on = !on; sw.style.background = on ? '#0b57d0' : '#9ca3af'; knob.style.left = on ? '25px' : '3px'; sw.setAttribute('aria-checked', String(on)); });
    row.appendChild(sw); s.body.appendChild(row);
    s.body.appendChild(el('div', 'font-size:.76rem;color:#4b5563;margin:12px 2px;line-height:1.4;', 'Allow iFiNeX to hand its own downloaded update to Android’s installer. It cannot install anything else without you tapping Install.'));
    s.body.appendChild(abtn('← Back to the app', function () { st.perm = on; s.close(); }, true));
  }
  function installScreen() {
    var s = screen('App installer');
    s.body.appendChild(el('div', 'font-weight:700;font-size:1.1rem;margin-bottom:6px;', 'Do you want to update this app?'));
    s.body.appendChild(el('div', 'font-size:.86rem;color:#374151;line-height:1.45;margin-bottom:6px;', 'iFiNeX ' + OLD.name + ' → ' + NEW.name + '. Your existing data and settings are kept. The app restarts when it finishes.'));
    var act = el('div', 'margin-top:14px;'); s.body.appendChild(act);
    act.appendChild(abtn('Cancel', function () { s.close(); }, false));
    act.appendChild(abtn('Update', async function () {
      act.remove(); var bar = el('div', 'height:8px;border-radius:6px;background:#d1d5db;overflow:hidden;margin-top:18px;'), fill = el('div', 'height:100%;width:0;background:#0b57d0;transition:width .3s;'); bar.appendChild(fill); s.body.appendChild(bar);
      var msg = el('div', 'font-size:.86rem;margin-top:10px;', 'Installing…'); s.body.appendChild(msg);
      await sleep(150); fill.style.width = '60%'; await sleep(900); fill.style.width = '100%'; await sleep(600);
      msg.textContent = '✅ App updated to ' + NEW.name + ' — restarting…'; await sleep(1200);
      st.installed = true; s.close();
      var dlg = D.querySelector('[role=dialog][aria-modal]:not([style*="10050"])'); try { if (dlg && dlg.parentNode) dlg.parentNode.remove(); } catch (e) { }
      toast('✅ iFiNeX ' + NEW.name + ' installed (demo). Open “Check for updates” again: it now says you have the newest version.');
    }, true));
  }
  function browserScreen() {
    var s = screen('Browser'); 
    s.body.appendChild(el('div', 'background:#fff;border-radius:22px;padding:10px 14px;font-size:.8rem;color:#111;margin-bottom:14px;word-break:break-all;', '🔒 github.com/SquadSplit/iFiNeX-Mobile/releases/latest'));
    var c = el('div', 'background:#fff;border-radius:14px;padding:14px;');
    c.appendChild(el('div', 'font-weight:700;', 'iFiNeX-app-v' + NEW.name + '-b' + NEW.code + '.apk'));
    c.appendChild(el('div', 'font-size:.8rem;color:#4b5563;margin:4px 0 10px;', '9.4 MB · same file the in-app button downloads'));
    c.appendChild(abtn('Download', function () { c.appendChild(el('div', 'font-size:.8rem;margin-top:8px;color:#166534;', 'Downloaded. Open the .apk from your notifications and tap Install (Android may ask once to allow it).')); }, true));
    s.body.appendChild(c);
    s.body.appendChild(abtn('← Back to the app', function () { s.close(); }, false));
  }
  function toast(t) { var n = el('div', 'position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:10060;background:#14532d;color:#fff;border-radius:14px;padding:12px 14px;font-size:.84rem;line-height:1.4;box-shadow:0 8px 28px rgba(0,0,0,.4);', t); n.setAttribute('role', 'status'); D.body.appendChild(n); setTimeout(function () { n.remove(); }, 7000); }

  /* ---- fake native plugin (same method names/results as IfinexUpdatePlugin.java) ---- */
  var FAKE = {
    info: function () { var v = st.installed ? NEW : OLD; return Promise.resolve({ versionName: v.name, versionCode: v.code, packageName: 'io.github.squadsplit.app', repo: 'SquadSplit/iFiNeX-Mobile', edition: edition, canInstall: st.perm, certSha256: 'DE30A1B2C3D4E5F60718293A4B5C6D7E8F9A0B1C2D3E4F5061728394A5B6C7D8' }); },
    check: async function () {
      await sleep(700); var v = st.installed ? NEW : OLD;
      return { ok: true, installedVersion: v.name, tag: 'v' + NEW.name, version: NEW.name, build: NEW.code, installedBuild: v.code, newer: !st.installed, hasApk: true, notes: NOTES, published: new Date().toISOString(), assetName: 'iFiNeX-app-v' + NEW.name + '-b' + NEW.code + '.apk', assetSize: 9847000, sha256Published: true };
    },
    addListener: function (n, f) { if (n === 'progress') st.listeners.push(f); return Promise.resolve({ remove: function () { st.listeners = st.listeners.filter(function (x) { return x !== f; }); } }); },
    download: async function () {
      var T = 9847000; for (var i = 1; i <= 12; i++) { await sleep(260); emit(Math.round(T * i / 12), T); }
      await sleep(500); /* "verify": same app id, higher build number, same signing certificate */ return { ok: true, version: NEW.name, bytes: T };
    },
    install: function () {
      if (!st.perm) { permScreen(); return Promise.resolve({ needsPermission: true }); }
      installScreen(); return Promise.resolve({ started: true });
    },
    openInBrowser: function () { browserScreen(); return Promise.resolve({ started: true }); }
  };

  function withNative(fn) {
    var had = Object.prototype.hasOwnProperty.call(W, 'Capacitor'), prev = W.Capacitor;
    W.Capacitor = { isNativePlatform: function () { return true; }, Plugins: { IfinexUpdater: FAKE } };
    try { return fn(); } finally { if (had) W.Capacitor = prev; else { try { delete W.Capacitor; } catch (e) { W.Capacitor = undefined; } } }
  }
  function open() {
    var r = withNative(function () { return realOpen(); });
    setTimeout(function () {
      try {
        var dlg = D.querySelector('[role=dialog][aria-modal]'); if (!dlg || dlg.querySelector('[data-demo-note]')) return;
        var n = el('div', 'font-size:.7rem;background:rgba(255,200,0,.14);border:1px dashed rgba(255,200,0,.6);border-radius:9px;padding:6px 9px;margin-bottom:8px;line-height:1.35;', '🎬 DEMO: this is the Android app’s update window with a simulated phone and a simulated GitHub release. Nothing is downloaded or installed.');
        n.setAttribute('data-demo-note', '1'); dlg.insertBefore(n, dlg.firstChild);
      } catch (e) { }
    }, 150);
    return r;
  }
  async function banner() {
    try { localStorage.removeItem('ifx_upd_banner'); localStorage.removeItem('ifx_upd_last'); } catch (e) { }
    D.getElementById('ifx-upd-banner') && D.getElementById('ifx-upd-banner').remove();
    await withNative(function () { return realQuiet(true); });
    var b = D.getElementById('ifx-upd-banner'); if (!b) return false;
    var v = Array.prototype.filter.call(b.querySelectorAll('button'), function (x) { return x.textContent === 'View'; })[0];
    if (v) { var c = v.cloneNode(true); v.replaceWith(c); c.addEventListener('click', function () { b.remove(); open(); }); }
    return true;
  }
  W.ifxUpdate.open = open;
  W.ifxDemoUpd = { open: open, openWeb: realOpen, banner: banner, reset: function () { st.installed = false; st.perm = false; } };
})(window, document);
