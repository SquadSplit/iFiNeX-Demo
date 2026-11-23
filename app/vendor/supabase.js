/* iFiNeX DEMO BACKEND (v9.7) — a tiny in-browser stand-in for supabase-js. NOT the real library, no network, no real data.
   One shared database lives in the TOP window (the demo shell); each iframe is a different fictional user, identified by
   window.name = "ifx-demo:<email>". Writes broadcast realtime events to every frame (like Supabase Realtime), tiny trigger
   stand-ins create notifications, and EVERY call is reported to the shell (event "ifx-demo-call") so the Inspector can show
   exactly which table, filter and payload the real app would send to the database. */
(function () {
  'use strict';
  var TOP = window.top;
  var me = (String(window.name || '').match(/^ifx-demo:(.+)$/) || [])[1] || 'alex@demo.test';
  function now() { return new Date().toISOString(); }
  var eqs = function (a, b) { return String(a == null ? '' : a).toLowerCase() === String(b == null ? '' : b).toLowerCase(); };

  if (!TOP.__IFX_DEMO) {
    var T = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
    var ds = function (off) { var x = new Date(T.getFullYear(), T.getMonth(), T.getDate() + off); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
    var ms = function (off) { var x = new Date(T.getFullYear(), T.getMonth() + off, 1); return x.getFullYear() + '-' + pad(x.getMonth() + 1); };
    var m = ms(0), pm = ms(-1), d = function (n) { return m + '-' + pad(Math.min(n, 28)); }, pd = function (n) { return pm + '-' + pad(n); };
    var dueIn = function (n) { return new Date(T.getFullYear(), T.getMonth(), T.getDate() + n).getDate(); };
    // an EPP plan that started two months ago: payments 1-2 paid, the rest pending
    var planPays = [], planStart = new Date(T.getFullYear(), T.getMonth() - 2, 5);
    for (var i = 0; i < 12; i++) { var pdn = new Date(planStart.getFullYear(), planStart.getMonth() + i, 5); planPays.push({ id: i + 1, plan_id: 1, user_email: 'alex@demo.test', seq: i + 1, due_date: pdn.getFullYear() + '-' + pad(pdn.getMonth() + 1) + '-05', amount: 300, status: i < 2 ? 'paid' : 'pending', paid_at: i < 2 ? now() : null, paid_by_email: i < 2 ? 'alex@demo.test' : null }); }
    var planEnd = new Date(planStart.getFullYear(), planStart.getMonth() + 11, 5);
    TOP.__IFX_DEMO = {
      seq: 1000, subs: [], log: [], gd: { links: {}, settings: {}, files: [], lastRun: {} },
      db: {
        app_users: [
          { id: 1, email: 'alex@demo.test', name: 'Alex', emoji: '😎', color: '#4d96ff', is_admin: true, group_type: 'squad_split', delegate_email: 'sam@demo.test', created_at: now() },
          { id: 2, email: 'priya@demo.test', name: 'Priya', emoji: '👩', color: '#ff92d0', is_admin: false, group_type: 'squad_split', delegate_email: null, created_at: now() },
          { id: 3, email: 'sam@demo.test', name: 'Sam', emoji: '🧑‍🍳', color: '#7bd88f', is_admin: false, group_type: 'general', delegate_email: null, created_at: now() }],
        bill_cards: [
          { id: 1, user_email: 'alex@demo.test', card_name: 'Demo Bank Platinum', color: '#4d96ff', due_day: dueIn(5), reminder_enabled: true, created_at: now() },
          { id: 2, user_email: 'priya@demo.test', card_name: 'Sample Cashback', color: '#ff92d0', due_day: dueIn(11), reminder_enabled: true, created_at: now() },
          { id: 3, user_email: 'alex@demo.test', card_name: 'Cash', color: '#6bcb77', due_day: null, reminder_enabled: true, created_at: now() }],
        bill_expenses: [
          { id: 1, user_email: 'alex@demo.test', description: 'Groceries', amount: 266.3, card_id: 1, category: 'food', date: d(3), month: m },
          { id: 2, user_email: 'alex@demo.test', description: 'Fuel', amount: 120, card_id: 3, category: 'transport', date: d(5), month: m },
          { id: 3, user_email: 'alex@demo.test', description: 'Cinema night', amount: 85, card_id: 1, category: 'entertainment', date: d(7), month: m },
          { id: 4, user_email: 'alex@demo.test', description: 'Pharmacy', amount: 42.5, card_id: 1, category: 'health', date: pd(20), month: pm },
          { id: 5, user_email: 'priya@demo.test', description: 'Dinner', amount: 159, card_id: 2, category: 'food', date: d(6), month: m }],
        bill_owed: [
          { id: 1, user_email: 'priya@demo.test', amount: 45, note: 'Cinema tickets', month: m, created_at: now() },
          { id: 2, user_email: 'priya@demo.test', amount: 80, note: 'Electricity share', month: pm, created_at: now() }],
        bill_settlements: [{ id: 1, user_email: 'priya@demo.test', amount: 20, month: pm, created_at: now() }],
        bill_payees: [
          { id: 1, user_email: 'priya@demo.test', party_name: 'Alex', party_email: 'alex@demo.test', color: '#4d96ff', created_at: now() },
          { id: 2, user_email: 'alex@demo.test', party_name: 'Landlord', party_email: null, color: '#ff922b', created_at: now() }],
        bill_payee_entries: [
          { id: 1, user_email: 'priya@demo.test', payee_id: 1, amount: 45, entry_type: 'owe', note: 'Dinner (put on your card)', date: d(4), month: m, created_by_email: 'priya@demo.test', payment_method: 'card', card_id: 1, payment_type: 'cash', created_at: now() },
          { id: 2, user_email: 'priya@demo.test', payee_id: 1, amount: 15, entry_type: 'paid', note: 'Paid back in cash', date: d(6), month: m, created_by_email: 'priya@demo.test', payment_method: 'cash', card_id: null, payment_type: 'cash', created_at: now() },
          { id: 3, user_email: 'alex@demo.test', payee_id: 2, amount: 1200, entry_type: 'owe', note: 'Rent', date: pd(1), month: pm, created_by_email: 'alex@demo.test', payment_method: 'account', card_id: null, payment_type: 'cash', created_at: now() },
          { id: 4, user_email: 'alex@demo.test', payee_id: 2, amount: 600, entry_type: 'paid', note: 'Half paid', date: pd(3), month: pm, created_by_email: 'alex@demo.test', payment_method: 'account', card_id: null, payment_type: 'cash', created_at: now() }],
        bill_card_payments: [], bill_card_shares: [],
        bill_plans: [{ id: 1, user_email: 'alex@demo.test', plan_type: 'epp', event_name: 'Mobile', title: 'Phone EPP', ledger: 'own', payee_id: null, card_id: 1, total_amount: 3600, installments: 12, start_date: planStart.getFullYear() + '-' + pad(planStart.getMonth() + 1) + '-05', end_date: planEnd.getFullYear() + '-' + pad(planEnd.getMonth() + 1) + '-05', due_day: 5, notes: 'Zero-interest plan', created_by_email: 'alex@demo.test', created_at: now() },
          { id: 2, user_email: 'alex@demo.test', plan_type: 'gold', event_name: 'Gold', title: 'Gold coin plan', ledger: 'own', payee_id: null, card_id: 3, total_amount: 300, installments: 3, start_date: pm + '-01', end_date: pm + '-03', due_day: 2, notes: '', created_by_email: 'alex@demo.test', created_at: now() }],
        bill_plan_payments: planPays.concat([1, 2, 3].map(function (n) { return { id: 100 + n, plan_id: 2, user_email: 'alex@demo.test', seq: n, due_date: pm + '-0' + n, amount: 100, status: 'paid', paid_at: now(), paid_by_email: 'alex@demo.test' }; })),
        bill_notifications: [{ id: 1, recipient_email: 'priya@demo.test', title: 'Welcome to the demo', message: 'Every change Alex makes that concerns you lands here at once.', is_read: false, created_at: now() }],
        bill_deleted_history: [], bill_user_prefs: [], bill_devices: [], bill_push_subscriptions: [],
        et_kinds: [],
        et_trackers: [
          { id: 1, user_email: 'alex@demo.test', kind: 'period', title: 'Home groceries', currency: 'AED', start_date: m + '-01', end_date: m + '-' + pad(new Date(T.getFullYear(), T.getMonth() + 1, 0).getDate()), participants: [], notes: '' },
          { id: 2, user_email: 'alex@demo.test', kind: 'trip', title: 'Dubai weekend', currency: 'AED', start_date: ds(-1), end_date: ds(2), participants: ['priya@demo.test'], notes: 'Hotel + food + fun' },
          { id: 3, user_email: 'alex@demo.test', kind: 'period', title: 'Last month groceries', currency: 'AED', start_date: pd(1), end_date: pd(28), participants: [], notes: '', status: 'active', auto_complete: true }],
        et_entries: [
          { id: 1, tracker_id: 1, user_email: 'alex@demo.test', category: 'Groceries', amount: 70.5, entry_date: d(2), note: 'weekly shop', spent_by: 'alex@demo.test' },
          { id: 2, tracker_id: 1, user_email: 'alex@demo.test', category: 'Groceries', amount: 205, entry_date: d(9), note: 'monthly top-up', spent_by: 'alex@demo.test' },
          { id: 3, tracker_id: 2, user_email: 'alex@demo.test', category: 'Stay', amount: 480, entry_date: ds(-1), note: 'Hotel (2 nights)', spent_by: 'alex@demo.test' },
          { id: 4, tracker_id: 2, user_email: 'alex@demo.test', category: 'Dinner', amount: 210, entry_date: ds(-1), note: 'Marina dinner', spent_by: 'priya@demo.test' },
          { id: 5, tracker_id: 2, user_email: 'alex@demo.test', category: 'Outing', amount: 160, entry_date: ds(0), note: 'Desert safari', spent_by: 'alex@demo.test' },
          { id: 6, tracker_id: 3, user_email: 'alex@demo.test', category: 'Groceries', amount: 310, entry_date: pd(12), note: 'month shop', spent_by: 'alex@demo.test' }],
        et_categories: [{ id: 1, user_email: 'alex@demo.test', name: 'Pets', icon: '🐾' }],
        bp_income: [{ id: 1, user_email: 'alex@demo.test', month: m, source: 'Company salary', kind: 'salary', amount: 12000, pay_date: d(1), note: '', created_by_email: 'alex@demo.test' }],
        bp_items: [
          { id: 1, user_email: 'alex@demo.test', month: m, category: 'Groceries', bucket: 'needs', planned: 800, note: '' },
          { id: 2, user_email: 'alex@demo.test', month: m, category: 'Outing', bucket: 'wants', planned: 300, note: '' },
          { id: 3, user_email: 'alex@demo.test', month: m, category: 'Emergency fund', bucket: 'savings', planned: 1500, note: '' },
          { id: 4, user_email: 'alex@demo.test', month: pm, category: 'Groceries', bucket: 'needs', planned: 750, note: '' },
          { id: 5, user_email: 'alex@demo.test', month: pm, category: 'Outing', bucket: 'wants', planned: 250, note: '' }],
        bp_goals: [{ id: 1, user_email: 'alex@demo.test', name: 'Emergency fund', target: 20000, saved: 2500, due_date: ds(365), note: '' },
          { id: 2, user_email: 'alex@demo.test', name: 'New headphones', target: 600, saved: 600, due_date: ds(-10), note: '' }],
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
          { id: 3, squad_id: 1, name: 'Cabin rental', amount: 240, paid_by: 'mia', split_between: ['alex', 'priya', 'mia', 'omar'], date: d(4), category: 'other', month: m, created_at: now() },
          { id: 4, squad_id: 2, name: 'Internet', amount: 40, paid_by: 'alex', split_between: ['alex', 'priya'], date: d(2), category: 'other', month: m, created_at: now() },
          { id: 5, squad_id: 2, name: 'Groceries', amount: 72, paid_by: 'priya', split_between: ['alex', 'priya'], date: d(6), category: 'market', month: m, created_at: now() }],
        prev_balances: [{ id: 1, squad_id: 1, from_member: 'omar', to_member: 'alex', amount: 35, month: pm, created_at: now() }], settlements: []
      }
    };
    TOP.__IFX_DEMO.db.app_users_directory = TOP.__IFX_DEMO.db.app_users;
  }
  var S = TOP.__IFX_DEMO, DB = S.db;

  function note(ev, o) { try { TOP.dispatchEvent(new TOP.CustomEvent('ifx-demo-call', { detail: Object.assign({ t: Date.now(), by: me }, o) })); } catch (e) { } }
  function emit(ev, table, row, old) {
    S.log.push({ t: Date.now(), ev: ev, table: table, row: row, by: me });
    S.subs.slice().forEach(function (s) {
      if (s.table !== table || (s.event !== '*' && s.event !== ev)) return;
      if (s.filter) { var f = /^(\w+)=eq\.(.*)$/.exec(s.filter); if (f && !eqs(row[f[1]], f[2])) return; }
      try { s.cb({ eventType: ev, new: row, old: old || {}, table: table, schema: 'public' }); } catch (e) { console.error(e); }
    });
    try { TOP.dispatchEvent(new TOP.CustomEvent('ifx-demo-event', { detail: { ev: ev, table: table, row: row, by: me } })); } catch (e) { }
  }
  function notify(to, title, message) {
    if (!to) return;
    var n = { id: ++S.seq, recipient_email: to, title: title, message: message, is_read: false, created_at: now() };
    DB.bill_notifications.push(n); emit('INSERT', 'bill_notifications', n);
  }
  function nameOf(email) { var u = DB.app_users.find(function (x) { return eqs(x.email, email); }); return u ? u.name : email; }
  function admins() { return DB.app_users.filter(function (u) { return u.is_admin; }); }
  function afterInsert(t, r) {          // stands in for the database triggers of the real project
    if (t === 'bill_owed' && !eqs(r.user_email, me)) notify(r.user_email, 'New owed entry', nameOf(me) + ' added ' + r.amount + ' AED — ' + (r.note || ''));
    if (t === 'bill_settlements') admins().forEach(function (a) { if (!eqs(a.email, me)) notify(a.email, 'Payment recorded', nameOf(r.user_email) + ' paid ' + r.amount + ' AED'); });
    if (t === 'bill_payee_entries') {
      var p = DB.bill_payees.find(function (x) { return x.id === r.payee_id; });
      if (p && p.party_email && !eqs(p.party_email, me)) notify(p.party_email, 'Ledger entry from ' + nameOf(r.created_by_email || me), r.entry_type + ' ' + r.amount + ' AED' + (r.note ? ' — ' + r.note : ''));
      else if (p && eqs(p.party_email, me) && !eqs(p.user_email, me)) notify(p.user_email, 'Ledger entry from ' + nameOf(me), r.entry_type + ' ' + r.amount + ' AED' + (r.note ? ' — ' + r.note : ''));
    }
  }
  function cmp(a, b) { var x = Number(a), y = Number(b); return (isFinite(x) && isFinite(y) && a !== '' && b !== '') ? x - y : (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0); }

  function builder(table) {
    var q = { op: 'select', f: [], payload: null, single: false, ord: null, cols: '*' };
    function match(r) {
      return q.f.every(function (f) {
        var v = r[f[1]];
        switch (f[0]) {
          case 'eq': return String(v) === String(f[2]);
          case 'neq': return String(v) !== String(f[2]);
          case 'ilike': return eqs(v, String(f[2]).replace(/\\/g, ''));
          case 'in': return f[2].map(String).indexOf(String(v)) >= 0;
          case 'notin': return f[2].map(String).indexOf(String(v)) < 0;
          case 'contains': return Array.isArray(v) && f[2].every(function (x) { return v.indexOf(x) >= 0; });
          case 'gt': return cmp(v, f[2]) > 0; case 'gte': return cmp(v, f[2]) >= 0; case 'lt': return cmp(v, f[2]) < 0; case 'lte': return cmp(v, f[2]) <= 0;
          case 'is': return f[2] === null ? v == null : v === f[2];
          case 'match': return Object.keys(f[2]).every(function (k) { return String(r[k]) === String(f[2][k]); });
        }
        return true;
      });
    }
    function fdesc() { return q.f.map(function (f) { return f[1] + ' ' + f[0] + ' ' + JSON.stringify(f[2]); }); }
    function run() {
      var rows = DB[table] = DB[table] || [], res, rec;
      if (q.op === 'select') {
        var out = rows.filter(match).map(function (r) { return Object.assign({}, r); });
        if (q.ord) out.sort(function (a, b) { return cmp(a[q.ord.c], b[q.ord.c]) * (q.ord.asc ? 1 : -1); });
        if (q.rng) out = out.slice(q.rng[0], q.rng[1] + 1); if (q.lim) out = out.slice(0, q.lim);
        note('select', { op: 'select', table: table, filters: fdesc(), rows: out.length, read: true });
        return q.single ? { data: out[0] || null, error: null } : { data: out, error: null };
      }
      if (q.op === 'insert') {
        var arr = Array.isArray(q.payload) ? q.payload : [q.payload];
        var made = arr.map(function (p) { var r = Object.assign({ id: ++S.seq, created_at: now() }, p); rows.push(r); emit('INSERT', table, r); afterInsert(table, r); return r; });
        note('insert', { op: 'insert', table: table, payload: q.payload, rows: made.length });
        return { data: q.single ? made[0] : made, error: null };
      }
      if (q.op === 'update') {
        var hit = rows.filter(match); hit.forEach(function (r) { var o = Object.assign({}, r); Object.assign(r, q.payload); emit('UPDATE', table, r, o); });
        note('update', { op: 'update', table: table, filters: fdesc(), payload: q.payload, rows: hit.length }); return { data: null, error: null };
      }
      if (q.op === 'delete') {
        var gone = rows.filter(match); DB[table] = rows.filter(function (r) { return gone.indexOf(r) < 0; }); gone.forEach(function (r) { emit('DELETE', table, r); });
        note('delete', { op: 'delete', table: table, filters: fdesc(), rows: gone.length }); return { data: null, error: null };
      }
      if (q.op === 'upsert') {
        var key = q.onConflict || 'id', keys = String(key).split(',');
        (Array.isArray(q.payload) ? q.payload : [q.payload]).forEach(function (p) {
          var ex = rows.find(function (r) { return keys.every(function (k) { return String(r[k]) === String(p[k]); }); });
          if (ex) { var o = Object.assign({}, ex); Object.assign(ex, p); emit('UPDATE', table, ex, o); } else { var r2 = Object.assign({ id: ++S.seq }, p); rows.push(r2); emit('INSERT', table, r2); }
        });
        note('upsert', { op: 'upsert', table: table, payload: q.payload, onConflict: key }); return { data: null, error: null };
      }
    }
    var api = {
      select: function (c) { q.cols = c || '*'; return api; }, insert: function (p) { q.op = 'insert'; q.payload = p; return api; }, update: function (p) { q.op = 'update'; q.payload = p; return api; },
      delete: function () { q.op = 'delete'; return api; }, upsert: function (p, o) { q.op = 'upsert'; q.payload = p; q.onConflict = o && o.onConflict; return api; },
      eq: function (c, v) { q.f.push(['eq', c, v]); return api; }, neq: function (c, v) { q.f.push(['neq', c, v]); return api; }, ilike: function (c, v) { q.f.push(['ilike', c, v]); return api; },
      in: function (c, v) { q.f.push(['in', c, v]); return api; }, contains: function (c, v) { q.f.push(['contains', c, v]); return api; },
      gt: function (c, v) { q.f.push(['gt', c, v]); return api; }, gte: function (c, v) { q.f.push(['gte', c, v]); return api; }, lt: function (c, v) { q.f.push(['lt', c, v]); return api; }, lte: function (c, v) { q.f.push(['lte', c, v]); return api; },
      is: function (c, v) { q.f.push(['is', c, v]); return api; }, match: function (o) { q.f.push(['match', '*', o]); return api; },
      not: function (c, op, v) { if (op === 'in') q.f.push(['notin', c, String(v).replace(/^\(|\)$/g, '').split(',').map(function (x) { return x.replace(/"/g, ''); })]); return api; },
      order: function (c, o) { q.ord = { c: c, asc: !o || o.ascending !== false }; return api; }, limit: function (n) { q.lim = n; return api; }, range: function (a, b) { q.rng = [a, b]; return api; },
      maybeSingle: function () { q.single = true; return Promise.resolve(run()); }, single: function () { q.single = true; return Promise.resolve(run()); },
      then: function (a, b) { return Promise.resolve(run()).then(a, b); }
    };
    return api;
  }

  /* ---------- Google Drive stand-in (edge function + RPCs) ---------- */
  function gdStatus() {
    var G = S.gd, l = G.links[me], s = G.settings[me];
    return { connected: !!l, google_email: l ? l.google_email : null, needs_reauth: false, connected_at: l ? l.at : null, settings: s || null };
  }
  function gdNext(s) {
    var d = new Date(), hm = String(s.at_time || '03:00').split(':'); d.setHours(+hm[0] || 3, +hm[1] || 0, 0, 0);
    if (s.frequency === 'custom') { d = new Date(Date.now() + (s.custom_every || 1) * (s.custom_unit === 'hours' ? 3600e3 : 86400e3)); }
    else if (s.frequency === 'weekly') { while (d.getDay() !== s.weekday || d < new Date()) d.setDate(d.getDate() + 1); }
    else if (s.frequency === 'monthly') { d.setDate(s.month_day || 1); if (d < new Date()) d.setMonth(d.getMonth() + 1); }
    else if (d < new Date()) d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  function backupObject() {
    var tables = {}, counts = {}, total = 0, mine = function (r) { return !r.user_email || eqs(r.user_email, me) || eqs(r.owner_email, me); };
    ['bill_cards', 'bill_expenses', 'bill_owed', 'bill_settlements', 'bill_payees', 'bill_payee_entries', 'bill_plans', 'bill_plan_payments', 'et_trackers', 'et_entries', 'et_categories', 'bp_income', 'bp_items', 'bp_goals'].forEach(function (t) {
      var rows = (DB[t] || []).filter(mine); tables[t] = rows; counts[t] = rows.length; total += rows.length;
    });
    return { format: 'ifinex-server-backup', version: 1, app: 'iFiNeX (demo)', exported_at: now(), server: 'demo.example.invalid', server_name: 'iFiNeX DEMO', account: me, by: 'gdrive-backup', tables: tables, counts: counts, unavailable: [] };
  }
  function gdCall(path, body) {
    var G = S.gd, ok = function (o, st) { return { status: st || 200, json: Object.assign({ ok: true }, o) }; }, err = function (code, st, message) { return { status: st || 400, json: { ok: false, error: code, message: message } }; };
    note('edge', { op: 'POST', table: 'edge function /gdrive-backup' + path, payload: body, edge: true });
    if (path === '/start') return ok({ url: new URL('demo-google.html?return=' + encodeURIComponent((body && body.return_to) || location.href.split('#')[0]), location.href).href });
    if (!G.links[me]) return err('not_connected', 400, 'Connect Google Drive first.');
    if (path === '/backup-now') {
      if (G.lastRun[me] && Date.now() - G.lastRun[me] < 60000) return err('too_fast', 429);
      G.lastRun[me] = Date.now();
      var o = backupObject(), txt = JSON.stringify(o), t = new Date(), p2 = function (n) { return String(n).padStart(2, '0'); };
      var name = 'iFiNeX-backup-' + t.getUTCFullYear() + '-' + p2(t.getUTCMonth() + 1) + '-' + p2(t.getUTCDate()) + '_' + p2(t.getUTCHours()) + p2(t.getUTCMinutes()) + 'Z.json';
      var recs = Object.keys(o.counts).reduce(function (a, k) { return a + o.counts[k]; }, 0);
      G.files.unshift({ id: 'f' + (++S.seq), owner: me, name: name, size: txt.length, created: now(), text: txt });
      var s = G.settings[me] = G.settings[me] || {}; var keep = s.keep_last || 10;
      var mine = G.files.filter(function (f) { return f.owner === me; }); mine.slice(keep).forEach(function (f) { G.files.splice(G.files.indexOf(f), 1); });
      Object.assign(s, { last_run_at: now(), last_status: 'ok', last_message: recs + ' records', last_file_name: name, last_size: txt.length, last_records: recs });
      return ok({ file: name, records: recs, size: txt.length });
    }
    if (path === '/files') return ok({ files: G.files.filter(function (f) { return f.owner === me; }).map(function (f) { return { id: f.id, name: f.name, size: f.size, created: f.created }; }) });
    if (path === '/download') { var f = G.files.find(function (x) { return x.id === (body && body.id) && x.owner === me; }); return f ? { status: 200, text: f.text } : err('not_found', 404); }
    if (path === '/disconnect') { delete G.links[me]; if (G.settings[me]) G.settings[me].enabled = false; return ok({}); }
    return err('unknown', 404);
  }
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opt) {
    var u = String(url && url.url || url || '');
    var mm = /\/functions\/v1\/gdrive-backup(\/[a-z-]+)/.exec(u);
    if (mm) {
      var body = {}; try { body = JSON.parse((opt && opt.body) || '{}'); } catch (e) { }
      var r = gdCall(mm[1], body), text = r.text != null ? r.text : JSON.stringify(r.json);
      return Promise.resolve(new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } }));
    }
    return realFetch ? realFetch(url, opt) : Promise.reject(new Error('offline demo'));
  };

  /* ---------- RPC stand-ins (the real ones are Postgres functions) ---------- */
  var RESTORE_OK = ['bill_cards', 'bill_card_shares', 'bill_card_payments', 'bill_payees', 'bill_expenses', 'bill_owed', 'bill_settlements', 'bill_payee_entries', 'bill_plans', 'bill_plan_payments', 'bill_user_prefs', 'et_groups', 'et_trackers', 'et_entries', 'et_categories', 'et_kinds', 'bp_income', 'bp_items', 'bp_goals', 'members_config', 'expenses', 'settlements', 'prev_balances', 'squads', 'squad_members'];
  function rpc(fn, a) {
    a = a || {}; note('rpc', { op: 'rpc', table: fn + '()', payload: a, rpc: true });
    var ok = function (o) { return { data: Object.assign({ ok: true }, o), error: null }; }, bad = function (m) { return { data: null, error: { message: m } }; };
    if (fn === 'delete_owed_entry' || fn === 'delete_settlement_entry' || fn === 'delete_payee_entry') {
      var t = fn === 'delete_owed_entry' ? 'bill_owed' : fn === 'delete_settlement_entry' ? 'bill_settlements' : 'bill_payee_entries', id = a.p_id || a.p_entry_id;
      var row = (DB[t] || []).find(function (r) { return String(r.id) === String(id); });
      if (!row) return { data: { ok: false, error: 'not found' }, error: null };
      DB[t] = DB[t].filter(function (r) { return r !== row; }); emit('DELETE', t, row);
      DB.bill_deleted_history.push({ id: ++S.seq, kind: t, deleted_by: me, reason: a.p_reason, row: row, created_at: now() });
      var other = row.user_email;
      if (t === 'bill_payee_entries') { var pe = DB.bill_payees.find(function (p) { return p.id === row.payee_id; }); other = eqs(row.user_email, me) ? (pe && pe.party_email) : row.user_email; }
      else if (eqs(row.user_email, me)) other = (admins().find(function (x) { return !eqs(x.email, me); }) || {}).email;
      if (other && !eqs(other, me)) notify(other, 'Entry deleted', nameOf(me) + ' deleted an entry: ' + (a.p_reason || ''));
      return ok({});
    }
    if (fn === 'delete_payee_with_reason') {
      var es = DB.bill_payee_entries.filter(function (e) { return String(e.payee_id) === String(a.p_payee_id); }), pay = DB.bill_payees.find(function (p) { return String(p.id) === String(a.p_payee_id); });
      es.forEach(function (e) { DB.bill_deleted_history.push({ id: ++S.seq, kind: 'bill_payee_entries', deleted_by: me, reason: a.p_reason, row: e, created_at: now() }); });
      DB.bill_payee_entries = DB.bill_payee_entries.filter(function (e) { return es.indexOf(e) < 0; });
      DB.bill_payees = DB.bill_payees.filter(function (p) { return p !== pay; });
      if (pay && pay.party_email && !eqs(pay.party_email, me)) notify(pay.party_email, 'Party removed', nameOf(me) + ' removed you as a party: ' + a.p_reason);
      emit('DELETE', 'bill_payees', pay || {}); return ok({ archived: es.length });
    }
    if (fn === 'ifx_bulk_import') {
      var map = { bill_expenses: 'bill_expenses', bill_owed: 'bill_owed', bill_payee_entries: 'bill_payee_entries' }, tb = map[a.p_kind]; if (!tb) return bad('bad kind');
      (a.p_rows || []).forEach(function (r) { var x = Object.assign({ id: ++S.seq, created_at: now() }, r, { user_email: a.p_owner }); DB[tb].push(x); emit('INSERT', tb, x); });
      return ok({ inserted: (a.p_rows || []).length });
    }
    if (fn === 'ifx_restore_rows') {
      if (RESTORE_OK.indexOf(a.p_table) < 0) return ok({ inserted: 0, skipped: 0, failed: (a.p_rows || []).length, error: 'table not allowed' });
      var ins = 0, sk = 0, tbl = DB[a.p_table] = DB[a.p_table] || [];
      (a.p_rows || []).forEach(function (r) { if (tbl.some(function (x) { return String(x.id) === String(r.id) && r.id != null; })) sk++; else { tbl.push(Object.assign({}, r)); ins++; } });
      return ok({ inserted: ins, skipped: sk, failed: 0 });
    }
    if (fn === 'squad_save') {
      var ids = a.p_members || [], sid = a.p_id;
      if (!sid) { sid = ++S.seq; DB.squads.push({ id: sid, name: a.p_name, emoji: a.p_emoji || '👥', color: a.p_color || '#4d96ff', sort_order: DB.squads.length + 1, is_archived: false, created_by: me, created_at: now() }); }
      else { var sq = DB.squads.find(function (x) { return x.id === sid; }); if (sq) { sq.name = a.p_name; sq.emoji = a.p_emoji || sq.emoji; sq.color = a.p_color || sq.color; } }
      var drop = DB.squad_members.filter(function (r) { return r.squad_id === sid && ids.indexOf(r.member_id) < 0; });
      for (var k = 0; k < drop.length; k++) { var mid = drop[k].member_id, has = DB.expenses.some(function (e) { return e.squad_id === sid && (e.paid_by === mid || (e.split_between || []).indexOf(mid) >= 0); }); if (has) { var pn = DB.members_config.find(function (p) { return p.id === mid; }); return bad('member_has_data:' + (pn ? pn.name : mid)); } }
      DB.squad_members = DB.squad_members.filter(function (r) { return r.squad_id !== sid; });
      ids.forEach(function (mid2, i) { DB.squad_members.push({ id: ++S.seq, squad_id: sid, member_id: mid2, sort_order: i + 1 }); });
      emit('UPDATE', 'squads', { id: sid }); return { data: sid, error: null };
    }
    if (fn === 'squad_add_person') {
      var ex = a.p_email && DB.members_config.find(function (p) { return eqs(p.email, a.p_email); }); if (ex) return { data: ex.id, error: null };
      var pid = String(a.p_name || 'p').toLowerCase().replace(/[^a-z0-9]/g, '') + (++S.seq);
      DB.members_config.push({ id: pid, name: a.p_name, emoji: a.p_emoji || '🙂', color: a.p_color || '#7bd88f', is_admin: false, email: a.p_email || '', sort_order: DB.members_config.length + 1 });
      return { data: pid, error: null };
    }
    if (fn === 'squad_set_archived') { var q2 = DB.squads.find(function (x) { return x.id === a.p_id; }); if (q2) q2.is_archived = !!a.p_archived; return { data: null, error: null }; }
    if (fn === 'gdrive_status') return { data: gdStatus(), error: null };
    if (fn === 'gdrive_set_schedule') {
      var G = S.gd; if (a.p_enabled && !G.links[me]) return bad('not_connected');
      if (a.p_frequency === 'custom' && a.p_custom_unit === 'hours' && a.p_custom_every < 6) return bad('bad_interval');
      var st = G.settings[me] = Object.assign(G.settings[me] || {}, { enabled: a.p_enabled, frequency: a.p_frequency, at_time: a.p_at_time, weekday: a.p_weekday, month_day: a.p_month_day, custom_every: a.p_custom_every, custom_unit: a.p_custom_unit, tz: a.p_tz, keep_last: a.p_keep_last });
      st.next_run_at = a.p_enabled ? gdNext(st) : null; return { data: gdStatus(), error: null };
    }
    if (fn === 'register_device' || fn === 'unregister_device') return ok({});
    return ok({ inserted: 0, skipped: 0, failed: 0 });
  }

  var session = { access_token: 'demo', refresh_token: 'demo', expires_at: 9999999999, user: { id: 'demo-' + me, email: me, aud: 'authenticated' } };
  var FILES = {};   // storage stand-in: uploaded photos live as data URLs so every frame can show them
  function toDataUrl(blob) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = function () { res(''); }; r.readAsDataURL(blob); }); }
  var client = {
    from: builder, rpc: function (f, a) { return Promise.resolve(rpc(f, a)); },
    functions: { invoke: function (name) { note('edge', { op: 'POST', table: 'edge function /' + name, edge: true }); return Promise.resolve({ data: null, error: { message: 'The "' + name + '" function is not part of the demo' } }); } },
    auth: {
      getSession: async function () { return { data: { session: session }, error: null }; },
      getUser: async function () { return { data: { user: session.user }, error: null }; },
      refreshSession: async function () { return { data: { session: session }, error: null }; },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () { } } } }; },
      signOut: async function () { return { error: null }; }, signInWithOtp: async function () { return { error: null }; }, verifyOtp: async function () { return { error: null }; }
    },
    storage: {
      from: function (bucket) {
        return {
          upload: async function (path, blob) { FILES[bucket + '/' + path] = await toDataUrl(blob); note('storage', { op: 'upload', table: 'storage ' + bucket, payload: { path: path, bytes: blob && blob.size } }); return { error: null }; },
          getPublicUrl: function (path) { return { data: { publicUrl: FILES[bucket + '/' + path] || '' } }; }
        };
      }
    },
    channel: function () {
      var ch = { _subs: [], on: function (type, opt, cb) { ch._subs.push({ table: opt.table, event: opt.event || '*', filter: opt.filter, cb: cb }); return ch; },
        subscribe: function (cb) { ch._subs.forEach(function (s) { S.subs.push(s); }); if (cb) try { cb('SUBSCRIBED'); } catch (e) { } return ch; } };
      return ch;
    },
    removeChannel: function (ch) { if (ch && ch._subs) S.subs = S.subs.filter(function (s) { return ch._subs.indexOf(s) < 0; }); },
    removeAllChannels: function () { }
  };
  window.supabase = { createClient: function () { return client; } };
})();
