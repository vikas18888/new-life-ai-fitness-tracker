// ===== New Life - tracker.js (Daily Fitness Tracker) =====
console.log('tracker.js loaded OK');

(function () {
  const $ = (id) => document.getElementById(id);
  const KEY = 'nl_daily';

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
  function todayStr() { return fmt(new Date()); }

  let logs = load(KEY, {});
  let chart = null;

  function waterTargetL(p) {
    if (!p) return 2.5;
    let w = p.weight * 0.035;
    if (p.activity === 'moderate') w += 0.25;
    if (p.activity === 'active') w += 0.5;
    return Math.round(w * 10) / 10;
  }

  function todayAuto() {
    const p = load('nl_profile', null);
    const water = load('nl_water', { date: '', ml: 0 });
    const ml = water.date === todayStr() ? water.ml : 0;
    const ws = load('nl_workouts', []).filter((w) => w.date === todayStr());
    const bodyWt = p ? p.weight : 70;
    const burned = Math.round(ws.reduce((s, x) => s + x.sets * x.reps * 0.5 * (bodyWt / 70), 0));
    return { ml: ml, workouts: ws.length, burned: burned, waterTarget: waterTargetL(p) };
  }

  // ---------- Score (out of 100) ----------
  function calcScore(a, steps, sleep) {
    const w = Math.min(1, a.ml / (a.waterTarget * 1000)) * 25;
    const wo = a.workouts > 0 ? 25 : 0;
    const sl = Math.min(1, (sleep || 0) / 7) * 25;
    const st = Math.min(1, (steps || 0) / 8000) * 25;
    return Math.round(w + wo + sl + st);
  }

  // ---------- Streak ----------
  function calcStreak() {
    const d = new Date();
    let count = 0;
    if (!logs[fmt(d)]) d.setDate(d.getDate() - 1);
    while (logs[fmt(d)]) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  function numOrNull(id) {
    const v = $(id).value.trim();
    return v === '' ? null : parseFloat(v);
  }

  // ---------- Live summary ----------
  function refreshLive() {
    const a = todayAuto();
    const steps = numOrNull('dtSteps');
    const sleep = numOrNull('dtSleep');
    $('dtWater').textContent = (a.ml / 1000).toFixed(2) + ' / ' + a.waterTarget + ' L';
    $('dtWorkouts').textContent = a.workouts + ' exercise' + (a.workouts === 1 ? '' : 's');
    $('dtScore').textContent = calcScore(a, steps, sleep) + '/100';
    const s = calcStreak();
    $('dtStreak').textContent = s + (s === 1 ? ' day' : ' days');
  }

  // ---------- Save ----------
  $('dailyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('dtMsg');
    const weight = numOrNull('dtWeight');
    const steps = numOrNull('dtSteps');
    const sleep = numOrNull('dtSleep');
    const calories = numOrNull('dtCalories');

    if (weight === null && steps === null && sleep === null && calories === null) {
      msg.style.color = '#ff6b6b';
      msg.textContent = 'Please fill in at least one field (weight, steps, sleep, or calories).';
      return;
    }
    if (weight !== null && (!isFinite(weight) || weight < 30 || weight > 250)) {
      msg.style.color = '#ff6b6b'; msg.textContent = 'Enter weight in kg (between 30 and 250).'; return;
    }
    if (steps !== null && (!isFinite(steps) || steps < 0 || steps > 100000)) {
      msg.style.color = '#ff6b6b'; msg.textContent = 'Enter steps between 0 and 100,000.'; return;
    }
    if (sleep !== null && (!isFinite(sleep) || sleep < 0 || sleep > 24)) {
      msg.style.color = '#ff6b6b'; msg.textContent = 'Enter sleep hours between 0 and 24.'; return;
    }
    if (calories !== null && (!isFinite(calories) || calories < 0 || calories > 10000)) {
      msg.style.color = '#ff6b6b'; msg.textContent = 'Enter calories between 0 and 10,000.'; return;
    }

    const a = todayAuto();
    logs[todayStr()] = {
      weight: weight,
      steps: steps,
      sleep: sleep,
      calories: calories,
      water: Math.round((a.ml / 1000) * 100) / 100,
      workouts: a.workouts,
      burned: a.burned,
      score: calcScore(a, steps, sleep)
    };
    save(KEY, logs);

    msg.style.color = '#4ade80';
    msg.textContent = 'Today\'s log saved! 💪';
    renderAll();
  });

  ['dtWeight', 'dtSteps', 'dtSleep', 'dtCalories'].forEach((id) => {
    $(id).addEventListener('input', refreshLive);
  });

  // ---------- History ----------
  function prettyDate(key) {
    const parts = key.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function renderHistory() {
    const list = $('dtHistory');
    list.innerHTML = '';
    const keys = Object.keys(logs).sort().reverse().slice(0, 7);
    if (keys.length === 0) {
      const li = document.createElement('li');
      li.className = 'history-empty';
      li.textContent = 'No logs recorded yet. Save today\'s log above.';
      list.appendChild(li);
      return;
    }
    keys.forEach((k) => {
      const l = logs[k];
      const li = document.createElement('li');

      const left = document.createElement('div');
      const date = document.createElement('strong');
      date.textContent = prettyDate(k);
      const info = document.createElement('span');
      const bits = [];
      if (l.weight !== null && l.weight !== undefined) bits.push(l.weight + ' kg');
      if (l.steps !== null && l.steps !== undefined) bits.push(l.steps + ' steps');
      if (l.sleep !== null && l.sleep !== undefined) bits.push(l.sleep + ' hrs sleep');
      if (l.calories !== null && l.calories !== undefined) bits.push(l.calories + ' kcal');
      bits.push(l.water + ' L water');
      bits.push(l.workouts + ' workouts');
      info.textContent = bits.join('  |  ');
      left.appendChild(date);
      left.appendChild(info);

      const right = document.createElement('div');
      right.className = 'history-right';
      const score = document.createElement('span');
      score.className = 'history-score';
      score.textContent = l.score + '/100';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'history-del';
      del.textContent = '✕';
      del.title = 'Delete this log';
      del.addEventListener('click', () => {
        delete logs[k];
        save(KEY, logs);
        renderAll();
      });
      right.appendChild(score);
      right.appendChild(del);

      li.appendChild(left);
      li.appendChild(right);
      list.appendChild(li);
    });
  }

  // ---------- Chart ----------
  function renderChart() {
    const wrap = $('dtChart').parentElement;
    if (typeof Chart === 'undefined') {
      wrap.textContent = 'Chart failed to load (please check your internet connection).';
      return;
    }
    const metric = $('dtMetric').value;
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = fmt(d);
      labels.push(key.slice(8) + '/' + key.slice(5, 7));
      const l = logs[key];
      const v = l ? l[metric] : null;
      data.push(v === undefined ? null : v);
    }

    const names = {
      weight: 'Weight (kg)', steps: 'Steps', sleep: 'Sleep (hrs)',
      calories: 'Calories Consumed', water: 'Water (L)', score: 'Daily Score'
    };
    const isLine = metric === 'weight';

    if (chart) chart.destroy();
    chart = new Chart($('dtChart'), {
      type: isLine ? 'line' : 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: names[metric],
          data: data,
          borderColor: '#2f8cff',
          backgroundColor: isLine ? 'rgba(47,140,255,0.2)' : 'rgba(47,140,255,0.65)',
          borderWidth: 2,
          borderRadius: 6,
          tension: 0.3,
          spanGaps: true,
          pointRadius: 4,
          pointBackgroundColor: '#cfd6df'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9aa7bd' } } },
        scales: {
          x: { ticks: { color: '#9aa7bd' }, grid: { color: 'rgba(160,190,255,0.08)' } },
          y: { ticks: { color: '#9aa7bd' }, grid: { color: 'rgba(160,190,255,0.08)' }, beginAtZero: !isLine }
        }
      }
    });
  }

  $('dtMetric').addEventListener('change', renderChart);

  // ---------- Start ----------
  function prefillToday() {
    const l = logs[todayStr()];
    if (!l) return;
    if (l.weight !== null && l.weight !== undefined) $('dtWeight').value = l.weight;
    if (l.steps !== null && l.steps !== undefined) $('dtSteps').value = l.steps;
    if (l.sleep !== null && l.sleep !== undefined) $('dtSleep').value = l.sleep;
    if (l.calories !== null && l.calories !== undefined) $('dtCalories').value = l.calories;
  }

  function renderAll() {
    refreshLive();
    renderHistory();
    renderChart();
  }

  $('dtDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  prefillToday();
  renderAll();

  setInterval(refreshLive, 2000);
})();