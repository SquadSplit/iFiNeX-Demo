/* iFiNeX guided scenarios. Each step: u = who is signed in (alex admin · priya member · sam = Alex's delegate), p = module page,
   go = JS run inside the app frame (opens the right screen), title/text = what to do and what to notice, act = optional "do it for me" button
   (performs the same database call the app would — you will see it in the Inspector). */
(function () {
  var BT = 'bill-tracker.html', SQ = 'squad.html';
  function mon() { return new Date().toISOString().slice(0, 7); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function ins(c, t, row) { return c.sb().from(t).insert(row); }
  var A = 'alex@demo.test', P = 'priya@demo.test', S = 'sam@demo.test';

  window.IFX_SCENARIOS = [
    { id: 'tour', icon: '🧭', title: '5-minute tour', blurb: 'The Hub, Bill Tracker, trackers, budget, plans — one screen at a time.', steps: [
      { u: 'alex', p: BT, go: "switchPage('hub')", title: 'The Hub — your front door', text: 'Eight tiles, one per tool. The Squad Split tile only shows for accounts of the “squad” kind. Tap any tile to open that tool.' },
      { u: 'alex', p: BT, go: "switchPage('home')", title: 'Bill Tracker · Home', text: 'Three tabs: 💵 Spent (this month’s spending by card, with a month switcher), ⚖️ You Owe, 🔁 Owed to You. Try the ‹ › month arrows.' },
      { u: 'alex', p: BT, go: "switchPage('cards')", title: 'Cards', text: 'Every card has a due day and a reminder switch. Tap one to see its statement cycle and what was spent on it — including entries other people put on your card.' },
      { u: 'alex', p: BT, go: "etTab='trip';switchPage('et')", title: 'Expense Tracker (period · trip · occasion)', text: 'One engine, three kinds. “Dubai weekend” is a trip with a participant; “Home groceries” is a period tracker. Open one to see categories and entries.' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Budget & Salary Planner', text: 'Income → 50/30/20 buckets (or your own split) → planned items → savings goals.' },
      { u: 'alex', p: BT, go: "switchPage('plans')", title: 'EPP & Gold Plans', text: 'An instalment plan with a payment schedule: two payments are already ticked, the rest are pending.' },
      { u: 'alex', p: SQ, go: '', title: 'Squad Split', text: 'Two squads (Weekend Trip, Flat 12). Net balances and the minimum number of payments to settle everyone.' }
    ] },
    { id: 'spend', icon: '💵', title: 'Record a spend', blurb: 'Add a personal expense and watch the Home totals change.', steps: [
      { u: 'alex', p: BT, go: "switchPage('add')", title: 'Open ➕ Add', text: 'The Add page has two parts: your own spend, and (for admins/delegates) a party ledger. Fill description, amount, card and date, then save.' },
      { u: 'alex', p: BT, go: "switchPage('add')", title: 'Or let the demo do it', text: 'This inserts “Coffee” (AED 12.50) on the Demo Bank card exactly like the form does.', act: { label: 'Insert “Coffee 12.50”', run: function (c) { return ins(c, 'bill_expenses', { user_email: A, description: 'Coffee (demo)', amount: 12.5, card_id: 1, category: 'food', date: today(), month: mon() }); } } },
      { u: 'alex', p: BT, go: "switchPage('home');switchHomeTab('spent')", title: 'Check Home → Spent', text: 'The month total and the Demo Bank card total include the new row. Open the Inspector tab to see the INSERT into bill_expenses with its payload.' }
    ] },
    { id: 'cards', icon: '💳', title: 'Cards & statement cycle', blurb: 'Due day, reminders, who spent what on a card.', steps: [
      { u: 'alex', p: BT, go: "switchPage('cards')", title: 'Your cards', text: 'Demo Bank Platinum has a due day; Cash has none. The due-day reminder is what the 🔔 alerts use.' },
      { u: 'alex', p: BT, go: "switchPage('cards');setTimeout(function(){try{openCardDetail(1)}catch(e){}},300)", title: 'Card detail', text: 'Spend is grouped by statement cycle (the cycle ends on the due day). Entries Priya put on Alex’s card are attributed to her.' },
      { u: 'priya', p: BT, go: "switchPage('cards')", title: 'Priya sees only her own cards', text: 'Row-level security: Priya cannot read Alex’s cards. Only cards shared with her would appear under “Shared with me”.' }
    ] },
    { id: 'party', icon: '🤝', title: 'Party ledger & settling', blurb: 'Who owes whom, per person, with notifications.', steps: [
      { u: 'priya', p: BT, go: "switchPage('party')", title: 'Priya’s Party page', text: 'Party = a person you keep a running owe/paid ledger with. Priya has Alex as a party: she owes 45, paid 15 back.' },
      { u: 'priya', p: BT, go: "switchPage('party')", title: 'Priya pays something back', text: 'The demo records “paid AED 10” on the ledger — Alex is notified because Alex is a registered user.', act: { label: 'Record paid 10', run: function (c) { return ins(c, 'bill_payee_entries', { user_email: P, payee_id: 1, amount: 10, entry_type: 'paid', note: 'Paid back (demo)', date: today(), month: mon(), created_by_email: P, payment_method: 'cash', card_id: null, payment_type: 'cash' }); } } },
      { u: 'alex', p: BT, go: "switchPage('home')", title: 'Alex gets the alert', text: 'Look at the 🔔 bell: “Ledger entry from Priya”. It arrived by realtime — no refresh. Open the bell to read and clear it.' }
    ] },
    { id: 'admin', icon: '🛡️', title: 'Admin tools', blurb: 'Users, owed entries, delete with a reason, audit trail.', steps: [
      { u: 'alex', p: BT, go: "openAdmin()", title: 'Admin panel', text: 'Admins add users (they can then sign in), set a delegate, and manage “owed” entries for everyone. Only admins see ⚙️ Admin in the menu.' },
      { u: 'alex', p: BT, go: "switchPage('home');switchHomeTab('owedtome')", title: 'Owed to You', text: 'Alex sees what Priya owes (cinema 45, electricity 80, minus a 20 settlement). Entries can be deleted — but only WITH a reason.' },
      { u: 'alex', p: BT, go: "switchPage('home');switchHomeTab('owedtome')", title: 'Delete with a reason → Priya is told', text: 'The demo calls the same database function (delete_owed_entry). The row is archived in the deleted-history table and Priya gets a notification with your reason.', act: { label: 'Delete cinema entry (reason)', run: function (c) { return c.sb().rpc('delete_owed_entry', { p_id: 1, p_reason: 'Duplicate of the cinema bill' }); } } },
      { u: 'priya', p: BT, go: "switchPage('home')", title: 'Priya’s side', text: 'The bell shows “Entry deleted — Duplicate of the cinema bill”. Her owed list no longer has it.' }
    ] },
    { id: 'delegate', icon: '🧑‍💼', title: 'Delegate access', blurb: 'Sam acts on Alex’s account without Alex’s login.', steps: [
      { u: 'sam', p: BT, go: "switchPage('hub')", title: 'Sam signs in', text: 'Sam has an own account AND is set as delegate on Alex’s (admin) row. An account switcher appears.' },
      { u: 'sam', p: BT, go: "typeof openSwitchAccount==='function'?openSwitchAccount():0", title: 'Switch to Alex’s account', text: 'Pick “Delegated — Alex”. You now see and enter Alex’s data, but the audit trail still records YOUR email as the creator.' },
      { u: 'sam', p: BT, go: "switchPage('home')", title: 'Admin-delegate powers', text: 'Because the account he acts for is an admin, Sam may add and delete owed entries. A delegate of a normal member cannot.' }
    ] },
    { id: 'plans', icon: '📅', title: 'EPP & Gold plans', blurb: 'Instalments, schedule, mark paid, automatic rebalance.', steps: [
      { u: 'alex', p: BT, go: "switchPage('plans')", title: 'The plan list', text: '“Phone EPP”: 3 600 in 12 instalments of 300, due on the 5th. Progress bar shows paid vs pending.' },
      { u: 'alex', p: BT, go: "switchPage('plans')", title: 'Tick the next instalment', text: 'Marking an instalment paid stamps who paid and when. Tap a pending payment inside the plan to do it yourself.', act: { label: 'Mark #3 paid', run: function (c) { return c.sb().from('bill_plan_payments').update({ status: 'paid', paid_at: new Date().toISOString(), paid_by_email: A }).eq('id', 3); } } },
      { u: 'alex', p: BT, go: "openPlanModal()", title: 'Create a plan', text: 'Choose type (EPP or Gold), total, number of instalments, start date and card. The schedule is generated; change one amount and the rest rebalance.' }
    ] },
    { id: 'trip', icon: '✈️', title: 'Trip / event tracker', blurb: 'Categories, participants, who paid what.', steps: [
      { u: 'alex', p: BT, go: "etTab='trip';switchPage('et')", title: 'Trips tab', text: '“Dubai weekend” — 3 entries, one paid by Priya. 15 default categories plus your own (Pets is custom).' },
      { u: 'alex', p: BT, go: "etTab='trip';switchPage('et')", title: 'Add an entry', text: 'Add “Taxi 45” to the trip; totals and the per-category chart update.', act: { label: 'Insert Taxi 45', run: function (c) { return ins(c, 'et_entries', { tracker_id: 2, user_email: A, category: 'Transport', amount: 45, entry_date: today(), note: 'Taxi (demo)', spent_by: A }); } } },
      { u: 'alex', p: BT, go: "etTab='trip';switchPage('et')", title: 'Import / export', text: 'Use ☰ → ⇅ Import / Export to download a template, fill it in Excel and import it back (with preview and duplicate skipping).' }
    ] },
    { id: 'budget', icon: '📈', title: 'Budget planner', blurb: 'Salary → buckets → items → goals.', steps: [
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Income and split', text: 'Salary 12 000 this month. Buckets: Needs / Wants / Savings (50/30/20 default, or choose another split).' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Planned items vs actual', text: 'Groceries 800, Outing 300, Emergency fund 1 500. Compare planned against what you really spent in the other trackers.' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Goals', text: '“Emergency fund” 2 500 of 20 000. Add money to a goal and the progress bar moves.' }
    ] },
    { id: 'squad', icon: '👥', title: 'Squad split', blurb: 'Equal splits, net balances, minimum payments.', steps: [
      { u: 'alex', p: SQ, go: '', title: 'Weekend Trip squad', text: 'Four people, three expenses (fuel 60, BBQ 96, cabin 240). Everyone’s share is 99. See each person’s net and the “who pays whom” list — the app finds the smallest number of transfers.' },
      { u: 'alex', p: SQ, go: '', title: 'Add an expense', text: 'Use the form: what, how much, who paid, who shares. Or let the demo add “Ice cream 24” paid by Omar.', act: { label: 'Add ice cream 24', run: function (c) { return ins(c, 'expenses', { squad_id: 1, name: 'Ice cream (demo)', amount: 24, paid_by: 'omar', split_between: ['alex', 'priya', 'mia', 'omar'], date: today(), category: 'food', month: mon() }).then(function () { return c.refresh(); }); } } },
      { u: 'alex', p: SQ, go: '', title: 'Previous balances & settle', text: 'Omar’s carried-over 35 from last month is included. Record a settlement when someone pays — balances update.' }
    ] },
    { id: 'multisquad', icon: '🗂️', title: 'Multiple squads', blurb: 'Switch between Weekend Trip and Flat 12.', steps: [
      { u: 'alex', p: SQ, go: '', title: 'Squad switcher', text: 'Use the squad selector at the top. Each squad has its own members, expenses and balances; the same person can be in several.' },
      { u: 'alex', p: SQ, go: '', title: 'Create / edit a squad', text: 'Admins create squads and pick members. Removing a member who still has expenses in that squad is refused by the database (“member_has_data”).', act: { label: 'Try to remove Omar from Weekend Trip', run: function (c) { return c.sb().rpc('squad_save', { p_id: 1, p_name: 'Weekend Trip', p_emoji: '🏖️', p_color: '#4d96ff', p_members: ['alex', 'priya', 'mia'] }).then(function (r) { c.say(r.error ? '🚫 Refused: ' + r.error.message : 'Saved'); return r; }); } } }
    ] },
    { id: 'xfer', icon: '⇅', title: 'Import / Export', blurb: 'Excel & PDF export, template, validated import.', steps: [
      { u: 'alex', p: BT, go: "ifxXfer.open()", title: 'Open Import / Export', text: 'Pick a dataset (expenses, owed, party entries…), then Export (Excel/PDF), Template, or Import a filled file. Imports show a preview and skip duplicates.' },
      { u: 'alex', p: BT, go: "ifxXfer.open()", title: 'Honest note', text: 'In this demo the file dialogs run for real in your browser, but imported rows only go into the demo’s fake database.' }
    ] },
    { id: 'backup', icon: '💾', title: 'Backup & restore', blurb: 'Download a backup file, restore only missing rows.', steps: [
      { u: 'alex', p: BT, go: "ifxBR.open()", title: 'Backup & Restore window', text: 'Make a backup (.json) of your records. Restore adds back ONLY rows that are missing — it never overwrites or deletes (server function ifx_restore_rows, 200 rows per call).' },
      { u: 'alex', p: BT, go: "ifxBR.open()", title: 'Try a restore', text: 'Download a backup, delete an expense in the app, then restore the file: the deleted row returns, nothing else changes.' }
    ] },
    { id: 'drive', icon: '☁️', title: 'Google Drive backup', blurb: 'Connect, schedule, back up now, restore — simulated Google.', steps: [
      { u: 'alex', p: BT, go: "ifxGDrive.open()", title: 'Open the Drive window', text: 'Press “Choose Google account & connect”. You are sent to a SIMULATED Google page (clearly labelled) and back again.' },
      { u: 'alex', p: BT, go: "ifxGDrive.open()", title: 'Schedule + Back up now', text: 'Pick daily/weekly/monthly/custom, a time and how many files to keep, then “Back up to Google Drive now”. The edge function builds a JSON file of your records and stores it (here: in memory).' },
      { u: 'alex', p: BT, go: "ifxGDrive.open()", title: 'List & restore', text: 'Open the file list, choose a backup and restore it. Inspector shows the /gdrive-backup calls and the ifx_restore_rows batches.' },
      { u: 'alex', p: BT, go: "ifxGDrive.open()", title: 'What is simulated', text: 'Real: the screens and every request. Fake: Google’s page, the Drive upload and the scheduler (pg_cron) — nothing runs while the tab is closed.' }
    ] },
    { id: 'lifecycle', icon: '✅', title: 'Mark completed & Completed area', blurb: 'Edit, delete, mark as completed, reopen — and items that finish by themselves.', steps: [
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'The ⋯ menu', text: 'Every tracker card has a ⋯ button: ✏️ Edit, ✅ Mark as completed, 🗑️ Delete (Export stays where it was). Open it.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Mark as completed', text: 'Choose ✅ Mark as completed and confirm. Switch the view to Completed — the tracker is there now and read-only.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Reopen', text: 'In Completed choose ↩️ Reopen: it returns to Active and will not auto-complete again (auto_complete=false). Watch the Inspector: a normal PATCH on et_trackers.' },
      { u: 'alex', p: BT, go: "switchPage('plans')", title: 'EPP plans', text: 'Plans have the same menu. A plan with every instalment paid is shown under Completed by itself; the demo has one example.' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Budget planner', text: 'Budget lines, income and goals: ⋯ menus and an Active / Completed switch. A goal at or above its target is already completed.' },
      { u: 'alex', p: BT, go: "switchPage('et')", title: 'Automatic completion', text: 'A tracker whose end date is over (day 1–31 of last month, a finished trip) appears under Completed without you doing anything. In the real database ifx_auto_complete() makes it permanent every night at 00:10 Dubai time.' }
    ] },
    { id: 'filters', icon: '🔎', title: 'Filters: month, date range, category', blurb: 'Expense Tracker, EPP and Budget Planner.', steps: [
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Date filter', text: 'Use 📅 All dates / Month / Custom range. Month shows ‹ › arrows; Custom range shows From and To.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Category filter', text: 'Pick a category to see only matching trackers or entries. Filtering never deletes or moves anything.' },
      { u: 'alex', p: BT, go: "switchPage('plans')", title: 'Plans', text: 'Same bar on EPP & Gold plans, plus Active / Completed tabs.' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Budget planner', text: 'The month view is the default; switch to a custom range to see several months. Goals have no month so they only follow range mode.' }
    ] },
    { id: 'reports', icon: '📊', title: 'Reports: users, dates, PDF & Excel', blurb: 'Bill Tracker and Squad Split report center.', steps: [
      { u: 'alex', p: BT, go: "switchPage('home');ifxReports.open('bill')", title: 'Bill Tracker report button', text: 'Bill Tracker → Home → 📊 View report opens the statement window with only Bill Tracker ticked. Four choices: 1 Duration (Weekly, Monthly, All time, Custom), 2 Modules (tick boxes), 3 Users (admins and delegates can pick other users) and 4 Report type — Balances only or Full breakdown.' },
      { u: 'alex', p: BT, go: "switchPage('hub');ifxReports.open('all')", title: 'Hub: one report for everything', text: 'The Hub tile 📊 Reports & Downloads opens the same window with every module ticked. You get TOTAL TO PAY per person (Squad Split + Bill Tracker + EPP & Gold together), OWED TO YOU, Paid so far (to whom, how much, when) and a month-by-month balance: brought forward + new charges − paid = closing.' },
      { u: 'alex', p: BT, go: "switchPage('plans');ifxReports.open('plan')", title: 'Every module has its own report button', text: 'EPP & Gold plans, Shared cards, Party ledger, Expense / Event / Trip trackers (only that tracker type, or one chosen trip) and the Budget planner each have a 📊 button that opens the same window with just that module ticked. Press 👁 Preview, then ⬇ PDF, ⬇ Excel or ⬇ CSV.' },
      { u: 'alex', p: SQ, go: "ifxReports.open('squad')", title: 'Squad Split report', text: 'Same window from the squad page. Full breakdown lists every share, carried-forward balance and settlement with a running balance, so you can see: Jan 300 carried forward + Feb 250 spent − 280 settled = 270 still to pay.' }
    ] },
    { id: 'compare', icon: '🔀', title: 'Compare periods (2 · 3 · 4 …)', blurb: 'Months or custom dates side by side — Bill Tracker, Expense trackers, Budget. PDF · Excel · CSV.', steps: [
      { u: 'alex', p: BT, go: "switchPage('hub');ifxCompare.open('all')", title: 'One window for every module', text: 'Tick the modules (Bill Tracker, Expense trackers, Budget), then add periods. Presets: last 2, 3, 4 or 6 months — or press + Add period and pick any month or a custom date range for each one.' },
      { u: 'alex', p: BT, go: "ifxCompare.open('all')", title: 'Preview before you export', text: 'Press 👁 Preview. Every period is a column, followed by the change between them (amount and %). Choose whether the change is measured against the previous period or against the first one.' },
      { u: 'alex', p: BT, go: "switchPage('budget');setTimeout(function(){ifxCompare.open('bp')},300)", title: 'From a single module', text: 'The 🔀 Compare button on the Budget page, the Expense Tracker list and the Bill Tracker home opens the same window with only that module ticked.' },
      { u: 'alex', p: BT, go: "ifxCompare.open('all')", title: 'Download', text: '⬇ PDF, ⬇ Excel (a Summary sheet plus one sheet per module/section) or ⬇ CSV. On the phone the file goes to the Share sheet.' }
    ] },
    { id: 'clone', icon: '📑', title: 'Clone a tracker for next month', blurb: 'Ask for name and duration, copy the setup (and optionally the entries).', steps: [
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Open a period tracker', text: 'Open “Home groceries”. In the action row you now have 🏷️ Categories and 📑 Clone. The list cards have a clone button too.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Clone dialog', text: 'It suggests the next name (“… Dec 2026”) and the start date, then asks for the duration (to the end of that month, 1 month up to 1 year, 1–2 weeks, the same length, or your own end date). Tick what to copy: category list, people, notes and — only if you want — the entries, with their dates moved into the new period.' },
      { u: 'alex', p: BT, go: "switchPage('budget')", title: 'Budget tracker clone too', text: 'On the Budget page press 📑 Clone this month: choose the month to copy to (and how many months in a row), what to copy (income, budget lines) and what to do if that month already has entries. Nothing is overwritten.' }
    ] },
    { id: 'cats', icon: '🏷️', title: 'Categories that fit each tracker', blurb: 'Mess = meals only. Groceries = no meals. 11 ready-made sets, editable per tracker.', steps: [
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et');setTimeout(function(){try{openEtModal()}catch(e){}},400)", title: 'Pick the category set', text: 'When you create a tracker choose “Category set”: Mess / Tiffin (Breakfast, Lunch, Dinner, Snacks, Tea, Tiffin), Groceries (Vegetables, Fruits, Dairy, Meat …), Fuel & Car, Household bills, School, Office lunch, Medical, Pets, Trip, Event, General.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Only those categories appear', text: 'Add expense shows just the set of that tracker — a Mess tracker never offers “Fuel”, a Groceries tracker never offers “Lunch”.' },
      { u: 'alex', p: BT, go: "etTab='period';switchPage('et')", title: 'Edit them any time', text: '🏷️ Categories opens a list (one per line, “icon name”). Existing entries keep their category.' }
    ] },
    { id: 'update', icon: '⬆️', title: 'App update (direct install)', blurb: 'Banner → Download & install → Install now → Android installer. Also the browser fallback and Later.', steps: [
      { u: 'alex', p: BT, go: "ifxDemoUpd.reset();ifxDemoUpd.banner()", title: 'The “Update available” banner', text: 'The app checks GitHub at start and every 3 hours. When a newer build exists a banner appears at the bottom. Tapping View only opens the update window — nothing is downloaded yet.' },
      { u: 'alex', p: BT, go: "ifxDemoUpd.open()", title: '1 · Download & install (direct, inside the app)', text: 'Always the FIRST button. Tap it: a progress bar runs, then the file is verified (same app id, newer build number, same signing key). The button turns into “Install now”.' },
      { u: 'alex', p: BT, go: "ifxDemoUpd.open()", title: 'Install now → Android', text: 'The first time Android asks you to switch on “Allow from this source” (simulated screen), then come back and tap Install now again. Then the Android installer asks Update / Cancel. Your data is kept; the app restarts.' },
      { u: 'alex', p: BT, go: "ifxDemoUpd.open()", title: '2 · Download in browser instead', text: 'Second button, only if the direct way fails. It opens the release file in the phone’s browser; you open the .apk yourself and tap Install.' },
      { u: 'alex', p: BT, go: "ifxDemoUpd.open()", title: '3 · Later', text: 'Third button: closes the window; the red “new” dot stays on the menu entry. After an update, opening this window again says you already have the newest version.' },
      { u: 'alex', p: BT, go: "ifxDemoUpd.openWeb()", title: 'On the website instead', text: 'In a browser the same menu entry compares ifinex-version.json and offers “Reload and update now” — no APK involved.' }
    ] },
    { id: 'theme', icon: '🎨', title: 'Themes & alerts', blurb: '13 themes, 12 design styles, alert switches.', steps: [
      { u: 'alex', p: BT, go: "openAppearance()", title: 'Theme & background', text: 'Pick a colour theme and a design style; your choice follows you to every module and every device.' },
      { u: 'alex', p: BT, go: "openAlerts()", title: 'Alerts & notifications', text: 'Choose which reminders you want (card due dates, plans) and whether to enable push on this device. Push needs a real service worker + keys — in the demo only the switches work.' }
    ] }
  ];
})();
