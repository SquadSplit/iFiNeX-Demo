/* shared logic of web.html / mobile.html: user switch, module switch, restart */
(function(){
  var cfg = window.IFX_VIEW, frameBox = document.getElementById('box'), cur = { user: cfg.user, page: 'bill-tracker.html' };
  var USERS = { alex: ['alex@demo.test', 'Alex (admin)'], priya: ['priya@demo.test', 'Priya (member)'] };
  function load() {
    frameBox.innerHTML = '';
    var f = document.createElement('iframe'); f.id = 'fr'; f.name = 'ifx-demo:' + USERS[cur.user][0]; f.title = cfg.title;
    f.src = 'app/' + cur.page + (cur.page === 'squad.html' ? '?as=' + encodeURIComponent(USERS[cur.user][0]) : '');
    f.style.cssText = cfg.frameStyle; frameBox.appendChild(f);
  }
  function seg(id, key, val) {
    document.querySelectorAll('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === val ? 'true' : 'false'); });
  }
  document.querySelectorAll('#mod button').forEach(function (b) { b.onclick = function () { cur.page = b.dataset.v; seg('mod', 'page', cur.page); load(); }; });
  document.querySelectorAll('#usr button').forEach(function (b) { b.onclick = function () { cur.user = b.dataset.v; seg('usr', 'user', cur.user); load(); }; });
  document.getElementById('rst').onclick = function () { location.reload(); };
  seg('mod', 'page', cur.page); seg('usr', 'user', cur.user); load();
})();
