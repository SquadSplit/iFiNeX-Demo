/* iFiNeX DEMO BACKEND — a tiny in-browser stand-in for supabase-js. NOT the real library, no network, no real data.
   One shared database lives in the TOP window (the demo shell); each iframe (desktop / phone) is a different fictional user,
   identified by window.name = "ifx-demo:<email>". Writes broadcast realtime events to every frame, like Supabase Realtime. */
(function () {
  'use strict';
  var TOP = window.top;
  var me = (String(window.name || '').match(/^ifx-demo:(.+)$/) || [])[1] || 'alex@demo.test';
  function now() { return new Date().toISOString(); }
  if (!TOP.__IFX_DEMO) {
    var m = new Date().toISOString().slice(0, 7), d = function (n) { return m + '-' + String(n).padStart(2, '0'); };
    TOP.__IFX_DEMO = {
      seq: 1000, subs: [], log: [],
      db: {
        app_users: [
          { id: 1, email: 'alex@demo.test', name: 'Alex', emoji: '😎', color: '#4d96ff', is_admin: true, group_type: 'squad_split', delegate_email: null, created_at: now() },
          { id: 2, email: 'priya@demo.test', name: 'Priya', emoji: '👩', color: '#ff92d0', is_admin: false, group_type: 'squad_split', delegate_email: null, created_at: now() },
          { id: 3, email: 'sam@demo.test', name: 'Sam', emoji: '🧑‍🍳', color: '#7bd88f', is_admin: false, group_type: 'general', delegate_email: null, created_at: now() }],
        bill_cards: [
          { id: 1, user_email: 'alex@demo.test', card_name: 'Demo Bank Platinum', color: '#4d96ff', due_day: 12, reminder_enabled: true, created_at: now() },
          { id: 2, user_email: 'priya@demo.test', card_name: 'Sample Cashback', color: '#ff92d0', due_day: 20, reminder_enabled: true, created_at: now() }],
        bill_expenses: [
          { id: 1, user_email: 'alex@demo.test', description: 'Groceries (demo)', amount: 66.3, card_id: 1, category: 'food', date: d(3), month: m },
          { id: 2, user_email: 'alex@demo.test', description: 'Fuel (demo)', amount: 120, card_id: null, category: 'transport', date: d(5), month: m },
          { id: 3, user_email: 'priya@demo.test', description: 'Dinner (demo)', amount: 159, card_id: 2, category: 'food', date: d(6), month: m }],
        bill_owed: [{ id: 1, user_email: 'priya@demo.test', amount: 45, note: 'Cinema tickets (demo)', month: m, created_at: now() }],
        bill_notifications: [], bill_deleted_history: [], bill_settlements: [], bill_payees: [], bill_payee_entries: [], bill_card_payments: [],
        bill_card_shares: [], bill_plans: [], bill_plan_payments: [], bill_user_prefs: [],
        et_trackers: [{ id: 1, user_email: 'alex@demo.test', kind: 'period', title: 'Home groceries (demo)', currency: 'USD', start_date: d(1), end_date: d(28), participants: [], notes: '' }],
        et_entries: [{ id: 1, tracker_id: 1, user_email: 'alex@demo.test', category: 'Groceries', amount: 70.5, entry_date: d(2), note: 'weekly shop', spent_by: 'alex@demo.test' }],
        et_categories: [], bp_income: [], bp_items: [], bp_goals: [],
        members_config: [
          { id: 'alex', name: 'Alex', emoji: '😎', color: '#4d96ff', is_admin: true, email: 'alex@demo.test', sort_order: 1 },
          { id: 'priya', name: 'Priya', emoji: '👩', color: '#ff92d0', is_admin: false, email: 'priya@demo.test', sort_order: 2 },
          { id: 'mia', name: 'Mia', emoji: '🧑‍🎨', color: '#ffb84d', is_admin: false, email: '', sort_order: 3 },
          { id: 'omar', name: 'Omar', emoji: '🧔', color: '#7bd88f', is_admin: false, email: '', sort_order: 4 }],
        squads: [
          { id: 1, name: 'Weekend Trip', emoji: '🏖️', color: '#4d96ff', sort_order: 1, is_archived: false, created_by: 'alex@demo.test', created_at: now() },
          { id: 2, name: 'Flat 12', emoji: '🏠', color: '#ff92d0', sort_order: 2, is_archived: false, created_by: 'alex@demo.test', created_at: now() }],
        squad_members: [
          { id: 1, squad_id: 1, member_id: 'alex', sort_order: 1 }, { id: 2, squad_id: 1, member_id: 'priya', sort_order: 2 },
          { id: 3, squad_id: 1, member_id: 'mia', sort_order: 3 }, { id: 4, squad_id: 1, member_id: 'omar', sort_order: 4 },
          { id: 5, squad_id: 2, member_id: 'alex', sort_order: 1 }, { id: 6, squad_id: 2, member_id: 'priya', sort_order: 2 }],
        expenses: [
          { id: 1, squad_id: 1, name: 'Fuel', amount: 60, paid_by: 'alex', split_between: ['alex', 'priya', 'mia', 'omar'], date: d(3), category: 'fuel', month: m, created_at: now() },
          { id: 2, squad_id: 1, name: 'BBQ dinner', amount: 96, paid_by: 'priya', split_between: ['alex', 'priya', 'mia', 'omar'], date: d(4), category: 'food', month: m, created_at: now() },
          { id: 3, squad_id: 1, name: 'Cabin rental', amount: 240, paid_by: 'mia', split_between: ['alex', 'priya', 'mia', 'omar'], date: d(4), category: 'stay', month: m, created_at: now() },
          { id: 4, squad_id: 2, name: 'Internet', amount: 40, paid_by: 'alex', split_between: ['alex', 'priya'], date: d(2), category: 'bills', month: m, created_at: now() },
          { id: 5, squad_id: 2, name: 'Groceries', amount: 72, paid_by: 'priya', split_between: ['alex', 'priya'], date: d(6), category: 'food', month: m, created_at: now() }],
        prev_balances: [], settlements: []
      }
    };
    TOP.__IFX_DEMO.db.app_users_directory = TOP.__IFX_DEMO.db.app_users;
  }
  var S = TOP.__IFX_DEMO, DB = S.db;
  var eqs = function (a, b) { return String(a == null ? '' : a).toLowerCase() === String(b == null ? '' : b).toLowerCase(); };
  function emit(ev, table, row, old) {
    S.log.push({ t: Date.now(), ev: ev, table: table, row: row, by: me });
    S.subs.slice().forEach(function (s) {
      if (s.table !== table || (s.event !== '*' && s.event !== ev)) return;
      if (s.filter) { var f = /^(\w+)=eq\.(.*)$/.exec(s.filter); if (f && !eqs(row[f[1]], f[2])) return; }
      try { s.cb({ eventType: ev, new: row, old: old || {}, table: table, schema: 'public' }); } catch (e) { console.error(e); }
    });
    try { TOP.dispatchEvent(new TOP.CustomEvent('ifx-demo-event', { detail: { ev: ev, table: table, row: row, by: me } })); } catch (e) {}
  }
  function notify(to, title, message) {
    var n = { id: ++S.seq, recipient_email: to, title: title, message: message, is_read: false, created_at: now() };
    DB.bill_notifications.push(n); emit('INSERT', 'bill_notifications', n);
  }
  function nameOf(email) { var u = DB.app_users.find(function (x) { return eqs(x.email, email); }); return u ? u.name : email; }
  function afterInsert(t, r) {   // stands in for the database triggers of the real project
    if (t === 'bill_owed' && !eqs(r.user_email, me)) notify(r.user_email, 'New owe entry', nameOf(me) + ' added ' + r.amount + ' — ' + (r.note || ''));
    if (t === 'bill_owed' && eqs(r.user_email, me)) { var other = DB.app_users.find(function (u) { return !eqs(u.email, me) && u.group_type === 'squad_split'; }); if (other) notify(other.email, 'Owe entry added', nameOf(me) + ' recorded ' + r.amount + ' — ' + (r.note || '')); }
  }
  function builder(table) {
    var q = { op: 'select', f: [], payload: null, single: false, ord: null };
    function match(r) {
      return q.f.every(function (f) {
        var v = r[f[1]];
        if (f[0] === 'eq') return String(v) === String(f[2]);
        if (f[0] === 'neq') return String(v) !== String(f[2]);
        if (f[0] === 'ilike') return eqs(v, String(f[2]).replace(/\\/g, ''));
        if (f[0] === 'in') return f[2].map(String).indexOf(String(v)) >= 0;
        if (f[0] === 'notin') return f[2].map(String).indexOf(String(v)) < 0;
        if (f[0] === 'contains') return Array.isArray(v) && f[2].every(function (x) { return v.indexOf(x) >= 0; });
        return true;
      });
    }
    function run() {
      var rows = DB[table] = DB[table] || [];
      if (q.op === 'select') {
        var out = rows.filter(match).map(function (r) { return Object.assign({}, r); });
        if (q.ord) out.sort(function (a, b) { return (a[q.ord.c] > b[q.ord.c] ? 1 : a[q.ord.c] < b[q.ord.c] ? -1 : 0) * (q.ord.asc ? 1 : -1); });
        if (q.rng) out = out.slice(q.rng[0], q.rng[1] + 1); if (q.lim) out = out.slice(0, q.lim);
        return q.single ? { data: out[0] || null, error: null } : { data: out, error: null };
      }
      if (q.op === 'insert') {
        var arr = Array.isArray(q.payload) ? q.payload : [q.payload];
        var made = arr.map(function (p) { var r = Object.assign({ id: ++S.seq, created_at: now() }, p); rows.push(r); emit('INSERT', table, r); afterInsert(table, r); return r; });
        return { data: q.single ? made[0] : made, error: null };
      }
      if (q.op === 'update') { var hit = rows.filter(match); hit.forEach(function (r) { var o = Object.assign({}, r); Object.assign(r, q.payload); emit('UPDATE', table, r, o); }); return { data: null, error: null }; }
      if (q.op === 'delete') { var gone = rows.filter(match); DB[table] = rows.filter(function (r) { return gone.indexOf(r) < 0; }); gone.forEach(function (r) { emit('DELETE', table, r); }); return { data: null, error: null }; }
      if (q.op === 'upsert') {
        var key = q.onConflict || 'id';
        (Array.isArray(q.payload) ? q.payload : [q.payload]).forEach(function (p) { var ex = rows.find(function (r) { return r[key] === p[key]; }); if (ex) { var o = Object.assign({}, ex); Object.assign(ex, p); emit('UPDATE', table, ex, o); } else { var r2 = Object.assign({ id: ++S.seq }, p); rows.push(r2); emit('INSERT', table, r2); } });
        return { data: null, error: null };
      }
    }
    var api = {
      select: function () { return api; }, insert: function (p) { q.op = 'insert'; q.payload = p; return api; }, update: function (p) { q.op = 'update'; q.payload = p; return api; },
      delete: function () { q.op = 'delete'; return api; }, upsert: function (p, o) { q.op = 'upsert'; q.payload = p; q.onConflict = o && o.onConflict; return api; },
      eq: function (c, v) { q.f.push(['eq', c, v]); return api; }, neq: function (c, v) { q.f.push(['neq', c, v]); return api; }, ilike: function (c, v) { q.f.push(['ilike', c, v]); return api; },
      in: function (c, v) { q.f.push(['in', c, v]); return api; }, contains: function (c, v) { q.f.push(['contains', c, v]); return api; },
      not: function (c, op, v) { if (op === 'in') q.f.push(['notin', c, String(v).replace(/^\(|\)$/g, '').split(',').map(function (x) { return x.replace(/"/g, ''); })]); return api; },
      order: function (c, o) { q.ord = { c: c, asc: !o || o.ascending !== false }; return api; }, limit: function (n) { q.lim = n; return api; }, range: function (a, b) { q.rng = [a, b]; return api; },
      maybeSingle: function () { q.single = true; return Promise.resolve(run()); }, single: function () { q.single = true; return Promise.resolve(run()); },
      then: function (a, b) { return Promise.resolve(run()).then(a, b); }
    };
    return api;
  }
  function rpc(fn, a) {
    a = a || {};
    if (fn === 'delete_owed_entry' || fn === 'delete_settlement_entry' || fn === 'delete_payee_entry') {
      var t = fn === 'delete_owed_entry' ? 'bill_owed' : fn === 'delete_settlement_entry' ? 'bill_settlements' : 'bill_payee_entries', id = a.p_id || a.p_entry_id;
      var row = (DB[t] || []).find(function (r) { return String(r.id) === String(id); });
      if (!row) return { data: { ok: false, error: 'not found' }, error: null };
      DB[t] = DB[t].filter(function (r) { return r !== row; }); emit('DELETE', t, row);
      DB.bill_deleted_history.push({ id: ++S.seq, kind: t, deleted_by: me, reason: a.p_reason, row: row, created_at: now() });
      var other = DB.app_users.find(function (u) { return !eqs(u.email, me) && (eqs(u.email, row.user_email) || true); });
      if (other) notify(eqs(row.user_email, me) ? other.email : row.user_email, 'Entry deleted', nameOf(me) + ' deleted an entry: ' + (a.p_reason || ''));
      return { data: { ok: true }, error: null };
    }
    if (fn === 'squad_save') {            // stands in for the admin RPC of the real database (multi-squad, v9.3)
      var ids = a.p_members || [], sid = a.p_id;
      if (!sid) { sid = ++S.seq; DB.squads.push({ id: sid, name: a.p_name, emoji: a.p_emoji || '👥', color: a.p_color || '#4d96ff', sort_order: DB.squads.length + 1, is_archived: false, created_by: me, created_at: now() }); }
      else { var sq = DB.squads.find(function (x) { return x.id === sid; }); if (sq) { sq.name = a.p_name; sq.emoji = a.p_emoji || sq.emoji; sq.color = a.p_color || sq.color; } }
      DB.squad_members = DB.squad_members.filter(function (r) { return r.squad_id !== sid; });
      ids.forEach(function (mid, i) { DB.squad_members.push({ id: ++S.seq, squad_id: sid, member_id: mid, sort_order: i + 1 }); });
      emit('UPDATE', 'squads', { id: sid });
      return { data: sid, error: null };
    }
    if (fn === 'squad_add_person') {
      var pid = String(a.p_name || 'p').toLowerCase().replace(/[^a-z0-9]/g, '') + (++S.seq);
      DB.members_config.push({ id: pid, name: a.p_name, emoji: a.p_emoji || '🙂', color: a.p_color || '#7bd88f', is_admin: false, email: a.p_email || '', sort_order: DB.members_config.length + 1 });
      return { data: pid, error: null };
    }
    if (fn === 'squad_set_archived') { var q2 = DB.squads.find(function (x) { return x.id === a.p_id; }); if (q2) q2.is_archived = !!a.p_archived; return { data: null, error: null }; }
    if (fn === 'register_device' || fn === 'unregister_device') return { data: { ok: true }, error: null };
    return { data: { ok: true, inserted: 0, skipped: 0, failed: 0 }, error: null };
  }
  var session = { access_token: 'demo', refresh_token: 'demo', expires_at: 9999999999, user: { id: 'demo-' + me, email: me, aud: 'authenticated' } };
  var client = {
    from: builder, rpc: function (f, a) { return Promise.resolve(rpc(f, a)); },
    auth: {
      getSession: async function () { return { data: { session: session }, error: null }; },
      getUser: async function () { return { data: { user: session.user }, error: null }; },
      refreshSession: async function () { return { data: { session: session }, error: null }; },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
      signOut: async function () { return { error: null }; }, signInWithOtp: async function () { return { error: null }; }, verifyOtp: async function () { return { error: null }; }
    },
    storage: { from: function () { return { upload: async function () { return { error: null }; }, getPublicUrl: function () { return { data: { publicUrl: '' } }; } }; } },
    channel: function (name) {
      var ch = { _subs: [], on: function (type, opt, cb) { var s = { table: opt.table, event: opt.event || '*', filter: opt.filter, cb: cb }; ch._subs.push(s); return ch; },
        subscribe: function (cb) { ch._subs.forEach(function (s) { S.subs.push(s); }); if (cb) try { cb('SUBSCRIBED'); } catch (e) {} return ch; } };
      return ch;
    },
    removeChannel: function (ch) { if (ch && ch._subs) S.subs = S.subs.filter(function (s) { return ch._subs.indexOf(s) < 0; }); },
    removeAllChannels: function () {}
  };
  window.supabase = { createClient: function () { return client; } };
})();
