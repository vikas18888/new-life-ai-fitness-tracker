// ===== New Life - planner.js (Weekly day-wise workout plan) =====
console.log('planner.js loaded OK');

(function () {
  const $ = (id) => document.getElementById(id);
  const KEY_PLAN = 'nl_plan';
  const KEY_DONE = 'nl_plan_done';

  const DAYS = [
    { d: 1, s: 'Mon', n: 'Monday' },
    { d: 2, s: 'Tue', n: 'Tuesday' },
    { d: 3, s: 'Wed', n: 'Wednesday' },
    { d: 4, s: 'Thu', n: 'Thursday' },
    { d: 5, s: 'Fri', n: 'Friday' },
    { d: 6, s: 'Sat', n: 'Saturday' },
    { d: 0, s: 'Sun', n: 'Sunday' }
  ];

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function fmt(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function uid() {
    return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function ex(name, sets, reps) {
    return { id: uid(), name: name, sets: sets, reps: reps };
  }
  function rest() {
    return { title: 'Rest Day', ex: [] };
  }

  // ---------- Templates ----------
  const PUSH = () => [ex('Bench Press', 4, 8), ex('Overhead Press', 3, 10), ex('Incline Dumbbell Press', 3, 10), ex('Lateral Raise', 3, 15), ex('Triceps Pushdown', 3, 12)];
  const PULL = () => [ex('Pull-ups', 4, 8), ex('Barbell Row', 4, 8), ex('Lat Pulldown', 3, 10), ex('Face Pull', 3, 15), ex('Biceps Curl', 3, 12)];
  const LEGS = () => [ex('Squat', 4, 8), ex('Romanian Deadlift', 3, 10), ex('Leg Press', 3, 12), ex('Leg Curl', 3, 12), ex('Calf Raise', 4, 15)];
  const FULL = (t) => ({ title: t, ex: [ex('Squat', 3, 10), ex('Bench Press', 3, 10), ex('Barbell Row', 3, 10), ex('Overhead Press', 3, 10), ex('Plank (sec)', 3, 30)] });
  const UPPER = () => ({ title: 'Upper Body', ex: [ex('Bench Press', 4, 8), ex('Barbell Row', 4, 8), ex('Overhead Press', 3, 10), ex('Lat Pulldown', 3, 10), ex('Biceps Curl', 3, 12), ex('Triceps Pushdown', 3, 12)] });
  const LOWER = () => ({ title: 'Lower Body', ex: LEGS() });
  const HOME = (t, list) => ({ title: t, ex: list });

  const TEMPLATES = {
    fullbody: () => ({
      1: FULL('Full Body A'), 2: rest(), 3: FULL('Full Body B'),
      4: rest(), 5: FULL('Full Body C'), 6: rest(), 0: rest()
    }),
    home: () => ({
      1: HOME('Home Upper + Core', [ex('Push-ups', 4, 15), ex('Pike Push-ups', 3, 10), ex('Plank (sec)', 3, 30), ex('Crunches', 3, 20)]),
      2: HOME('Home Legs', [ex('Squats', 4, 20), ex('Lunges', 3, 12), ex('Glute Bridge', 3, 15), ex('Calf Raise', 3, 20)]),
      3: rest(),
      4: HOME('Home Full Body', [ex('Burpees', 3, 10), ex('Push-ups', 3, 12), ex('Squats', 3, 20), ex('Mountain Climbers', 3, 20)]),
      5: HOME('Home Core + Cardio', [ex('Plank (sec)', 3, 40), ex('Leg Raises', 3, 15), ex('Jumping Jacks', 3, 30), ex('Russian Twist', 3, 20)]),
      6: rest(), 0: rest()
    }),
    upperlower: () => ({
      1: UPPER(), 2: LOWER(), 3: rest(), 4: UPPER(), 5: LOWER(), 6: rest(), 0: rest()
    }),
    ppl: () => ({
      1: { title: 'Push', ex: PUSH() },
      2: { title: 'Pull', ex: PULL() },
      3: { title: 'Legs', ex: LEGS() },
      4: { title: 'Push', ex: PUSH() },
      5: { title: 'Pull', ex: PULL() },
      6: { title: 'Legs', ex: LEGS() },
      0: rest()
    }),
    empty: () => ({ 1: rest(), 2: rest(), 3: rest(), 4: rest(), 5: rest(), 6: rest(), 0: rest() })
  };

  // ---------- State ----------
  let plan = load(KEY_PLAN, null);
  if (!plan) {
    plan = TEMPLATES.fullbody();
    save(KEY_PLAN, plan);
  }
  let done = load(KEY_DONE, {});
  const todayDow = new Date().getDay();
  const todayKey = fmt(new Date());
  let selected = todayDow;

  function dayPlan(d) {
    if (!plan[d]) plan[d] = rest();
    if (!Array.isArray(plan[d].ex)) plan[d].ex = [];
    return plan[d];
  }

  function weekDate(d) {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((todayDow + 6) % 7));
    monday.setDate(monday.getDate() + ((d + 6) % 7));
    return fmt(monday);
  }

  // ---------- Rendering ----------
  function renderTabs() {
    const box = $('plTabs');
    box.innerHTML = '';
    DAYS.forEach((day) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'day-tab';
      if (day.d === selected) b.classList.add('active');
      if (day.d === todayDow) b.classList.add('today');
      b.textContent = day.s;
      b.title = day.n;
      b.addEventListener('click', () => {
        selected = day.d;
        $('plMsg').textContent = '';
        renderAll();
      });
      box.appendChild(b);
    });
  }

  function renderDay() {
    const dp = dayPlan(selected);
    const date = weekDate(selected);
    const doneMap = done[date] || {};
    const isToday = selected === todayDow;

    $('plTitle').value = dp.title;

    let badge = 'Upcoming';
    if (isToday) badge = 'TODAY';
    else if (date < todayKey) badge = 'Past';
    $('plBadge').textContent = badge;
    $('plBadge').className = 'day-badge' + (isToday ? ' is-today' : '');

    const total = dp.ex.length;
    const doneCount = dp.ex.filter((e) => doneMap[e.id]).length;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;
    $('plBar').style.width = pct + '%';
    $('plProgText').textContent = total
      ? doneCount + ' / ' + total + ' exercises completed (' + pct + '%)'
      : 'No exercises scheduled for this day.';

    const list = $('plList');
    list.innerHTML = '';

    if (total === 0) {
      const li = document.createElement('li');
      li.className = 'plan-empty';
      li.textContent = '😴 Rest day. Recovery is part of training. You can still add exercises below if you want.';
      list.appendChild(li);
      return;
    }

    dp.ex.forEach((e) => {
      const li = document.createElement('li');
      const isDone = !!doneMap[e.id];
      if (isDone) li.classList.add('done');

      const info = document.createElement('div');
      info.className = 'plan-info';
      const name = document.createElement('strong');
      name.textContent = e.name;
      const meta = document.createElement('span');
      meta.textContent = e.sets + ' sets x ' + e.reps + ' reps';
      info.appendChild(name);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'plan-actions';

      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'btn btn-small plan-done-btn';
      if (isDone) {
        doneBtn.textContent = '✓ Done';
        doneBtn.disabled = true;
      } else if (isToday) {
        doneBtn.textContent = 'Mark Done ✔';
        doneBtn.addEventListener('click', () => markDone(e));
      } else {
        doneBtn.textContent = 'Today only';
        doneBtn.disabled = true;
        doneBtn.title = 'You can only mark today\'s exercises as done';
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'history-del';
      del.textContent = '✕';
      del.title = 'Remove exercise';
      del.addEventListener('click', () => {
        dp.ex = dp.ex.filter((x) => x.id !== e.id);
        save(KEY_PLAN, plan);
        renderAll();
      });

      actions.appendChild(doneBtn);
      actions.appendChild(del);
      li.appendChild(info);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function renderWeekSummary() {
    let planned = 0;
    let completed = 0;
    DAYS.forEach((day) => {
      const dp = dayPlan(day.d);
      const map = done[weekDate(day.d)] || {};
      planned += dp.ex.length;
      completed += dp.ex.filter((e) => map[e.id]).length;
    });
    $('plWeekSummary').textContent = 'This week: ' + completed + ' / ' + planned + ' exercises done';
  }

  function renderAll() {
    renderTabs();
    renderDay();
    renderWeekSummary();
  }

  // ---------- Actions ----------
  function markDone(e) {
    if (!done[todayKey]) done[todayKey] = {};
    done[todayKey][e.id] = true;
    save(KEY_DONE, done);

    if (typeof window.nlAddWorkout === 'function') {
      window.nlAddWorkout(e.name, e.sets, e.reps);
    }
    renderAll();
  }

  $('plTitle').addEventListener('input', () => {
    dayPlan(selected).title = $('plTitle').value.trim() || 'Workout Day';
    save(KEY_PLAN, plan);
  });

  $('plAddForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const msg = $('plMsg');
    const name = $('plExName').value.trim();
    const sets = parseInt($('plExSets').value, 10);
    const reps = parseInt($('plExReps').value, 10);

    msg.style.color = '#ff6b6b';
    if (!name) { msg.textContent = 'Enter the exercise name.'; return; }
    if (!isFinite(sets) || sets < 1 || sets > 20) { msg.textContent = 'Enter sets between 1 and 20.'; return; }
    if (!isFinite(reps) || reps < 1 || reps > 300) { msg.textContent = 'Enter reps between 1 and 300.'; return; }

    const dp = dayPlan(selected);
    dp.ex.push(ex(name, sets, reps));
    if (dp.title === 'Rest Day') dp.title = 'Workout Day';
    save(KEY_PLAN, plan);

    $('plAddForm').reset();
    msg.textContent = '';
    renderAll();
  });

  $('plApply').addEventListener('click', () => {
    const key = $('plTemplate').value;
    if (!confirm('Your current weekly plan will be replaced. Continue?')) return;
    plan = TEMPLATES[key]();
    save(KEY_PLAN, plan);
    renderAll();
  });

  // ---------- Start ----------
  renderAll();
})();