/* iFiNeX DEMO — standalone mode with a SIMULATED Google. Loaded first. Nothing leaves the browser.
   The real app code runs unchanged (on-device engine, Google device-code sign-in, nightly backup, restore). Only these things are fake:
   Google's sign-in page (the code is auto-approved after a few seconds), the Drive API (an in-memory list that lives in the demo wrapper page, so it survives a simulated "new phone"),
   and the Android midnight job (the demo has a button that runs the same nightly routine at once). */
(function () {
  'use strict';
  try { localStorage.setItem('ifx_mode', 'standalone'); } catch (e) { }
  var cfg;
  Object.defineProperty(window, 'IFX_CFG', { configurable: true, get: function () { return cfg; }, set: function (v) { v.google = { clientId: 'demo-client.apps.googleusercontent.com', clientSecret: 'demo-secret', redirect: 'https://squadsplit.github.io/gdrive-return.html' }; cfg = v; } });
  var T = window.top, D = T.__SA_DRIVE = T.__SA_DRIVE || { files: [], n: 0, polls: 0, log: [] };
  var b64 = function (o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var ID = 'x.' + b64({ email: 'demo.user@gmail.example' }) + '.y';
  function J(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }); }
  function note(t) { D.log.unshift(new Date().toLocaleTimeString() + '  ' + t); D.log.length = Math.min(D.log.length, 40); }
  // the normal Google sign-in: the real code opens accounts.google.com; the demo plays the "choose account -> Allow -> back to the app" part after 2 s
  var realOpen = window.open ? window.open.bind(window) : null;
  window.open = function (u) {
    u = String(u || '');
    if (/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/.test(u)) {
      var st = decodeURIComponent((/[?&]state=([^&]+)/.exec(u) || [])[1] || ''); note('Google: account chooser shown -> demo.user@gmail.example -> Allow');
      setTimeout(function () { try { localStorage.setItem('ifx_gd_ret', '?code=DEMO-CODE&state=' + encodeURIComponent(st)); } catch (e) { } }, 2000); return null;
    }
    return realOpen ? realOpen.apply(window, arguments) : null;
  };
  var real = window.fetch.bind(window);
  window.fetch = async function (u, o) {
    u = String((u && u.url) || u); o = o || {};
    if (!/^https:\/\/(oauth2|www)\.googleapis\.com\//.test(u)) return real(u, o);
    var m = (o.method || 'GET').toUpperCase();
    if (/\/device\/code$/.test(u)) { D.polls = 0; note('Google: device code issued'); return J({ device_code: 'DEMO', user_code: 'DEMO-4321', verification_url: 'https://www.google.com/device', interval: 3, expires_in: 300 }); }
    if (/\/token$/.test(u)) {
      if (/device_code/.test(String(o.body || '')) && ++D.polls < 3) return J({ error: 'authorization_pending' }, 428);
      note('Google: signed in as demo.user@gmail.example'); return J({ access_token: 'AT' + Date.now(), refresh_token: 'RT-demo', expires_in: 3600, id_token: ID });
    }
    if (/\/upload\/drive\/v3\/files/.test(u) && m === 'POST') {
      var txt = typeof o.body === 'string' ? o.body : (o.body instanceof Uint8Array || o.body instanceof ArrayBuffer ? new TextDecoder().decode(o.body) : (o.body && o.body.text ? await o.body.text() : String(o.body || '')));
      var name = (txt.match(/"name":\s*"([^"]+)"/) || [])[1] || 'backup.json', payload = txt.split('\r\n\r\n').slice(2).join('\r\n\r\n').replace(/\r\n--[^\r\n]*--\s*$/, '');
      var f = { id: 'F' + (++D.n), name: name, size: String(payload.length), createdTime: new Date().toISOString(), data: payload }; D.files.unshift(f);
      note('Drive: saved ' + name + ' (' + Math.round(payload.length / 1024 * 10) / 10 + ' KB)'); return J({ id: f.id, name: f.name, size: f.size });
    }
    if (/\/drive\/v3\/files\?/.test(u) && m === 'GET' && !/alt=media/.test(u)) return J({ files: D.files.map(function (f) { return { id: f.id, name: f.name, size: f.size, createdTime: f.createdTime }; }) });
    var mm = u.match(/\/drive\/v3\/files\/([^?]+)\?.*alt=media/);
    if (mm) { var g = D.files.filter(function (x) { return x.id === mm[1]; })[0]; return g ? new Response(g.data, { status: 200 }) : J({}, 404); }
    if (m === 'DELETE') { var id = decodeURIComponent(u.split('/files/')[1] || ''); D.files = D.files.filter(function (x) { return x.id !== id; }); return new Response(null, { status: 204 }); }
    return J({}, 404);
  };
})();
