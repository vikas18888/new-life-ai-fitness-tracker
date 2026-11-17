// ===== New Life - meal.js (Meal / Calorie Tracker) =====
console.log('meal.js loaded OK');

(function () {
  const $ = (id) => document.getElementById(id);
  const KEY = 'nl_meals';

  const FOODS = [
    { n: 'Roti / Chapati', u: '1 roti', k: 120, p: 3.5, c: 20, f: 3 },
    { n: 'Plain Paratha', u: '1 paratha', k: 260, p: 5, c: 36, f: 10 },
    { n: 'Rice (cooked)', u: '1 bowl', k: 200, p: 4, c: 44, f: 0.5 },
    { n: 'Dal', u: '1 bowl', k: 150, p: 8, c: 22, f: 3 },
    { n: 'Rajma', u: '1 bowl', k: 190, p: 9, c: 28, f: 4 },
    { n: 'Chole', u: '1 bowl', k: 230, p: 10, c: 32, f: 7 },
    { n: 'Khichdi', u: '1 bowl', k: 180, p: 6, c: 32, f: 3 },
    { n: 'Mixed Veg Sabzi', u: '1 bowl', k: 120, p: 3, c: 12, f: 7 },
    { n: 'Aloo Sabzi', u: '1 bowl', k: 150, p: 3, c: 22, f: 6 },
    { n: 'Paneer Sabzi', u: '1 bowl', k: 280, p: 12, c: 8, f: 22 },
    { n: 'Paneer (raw)', u: '100 g', k: 265, p: 18, c: 3, f: 20 },
    { n: 'Egg (boiled)', u: '1 egg', k: 78, p: 6.3, c: 0.6, f: 5 },
    { n: 'Omelette (2 eggs)', u: '1 omelette', k: 190, p: 13, c: 2, f: 14 },
    { n: 'Chicken Breast (cooked)', u: '100 g', k: 165, p: 31, c: 0, f: 3.6 },
    { n: 'Chicken Curry', u: '1 bowl', k: 240, p: 20, c: 6, f: 15 },
    { n: 'Fish Curry', u: '1 bowl', k: 200, p: 20, c: 5, f: 11 },
    { n: 'Chicken Biryani', u: '1 plate', k: 500, p: 22, c: 60, f: 18 },
    { n: 'Idli', u: '1 idli', k: 60, p: 2, c: 12, f: 0.3 },
    { n: 'Plain Dosa', u: '1 dosa', k: 135, p: 3, c: 25, f: 3 },
    { n: 'Masala Dosa', u: '1 dosa', k: 250, p: 5, c: 38, f: 9 },
    { n: 'Sambar', u: '1 bowl', k: 100, p: 5, c: 14, f: 3 },
    { n: 'Poha', u: '1 plate', k: 270, p: 5, c: 45, f: 8 },
    { n: 'Upma', u: '1 plate', k: 250, p: 6, c: 38, f: 8 },
    { n: 'Oats with Milk', u: '1 bowl', k: 200, p: 8, c: 30, f: 5 },
    { n: 'Bread Slice', u: '1 slice', k: 80, p: 3, c: 14, f: 1 },
    { n: 'Sprouts', u: '1 bowl', k: 120, p: 9, c: 20, f: 1 },
    { n: 'Soya Chunks (dry)', u: '30 g', k: 100, p: 15, c: 10, f: 0.5 },
    { n: 'Salad', u: '1 bowl', k: 40, p: 2, c: 8, f: 0.3 },
    { n: 'Banana', u: '1 banana', k: 105, p: 1.3, c: 27, f: 0.4 },
    { n: 'Apple', u: '1 apple', k: 95, p: 0.5, c: 25, f: 0.3 },
    { n: 'Milk', u: '1 glass', k: 155, p: 8, c: 12, f: 8 },
    { n: 'Curd / Dahi', u: '1 bowl', k: 60, p: 3.5, c: 5, f: 3 },
    { n: 'Whey Protein', u: '1 scoop', k: 120, p: 24, c: 3, f: 1.5 },
    { n: 'Peanuts', u: '30 g', k: 170, p: 7.5, c: 5, f: 14 },
    { n: 'Almonds', u: '10 pcs', k: 70, p: 2.5, c: 2.5, f: 6 },
    { n: 'Peanut Butter', u: '1 tbsp', k: 95, p: 4, c: 3, f: 8 },
    { n: 'Tea (milk + sugar)', u: '1 cup', k: 70, p: 2, c: 10, f: 2.5 },
    { n: 'Samosa', u: '1 samosa', k: 260, p: 4, c: 28, f: 15 },
    { n: 'Pizza Slice', u: '1 slice', k: 285, p: 12, c: 36, f: 10 },
    { n: 'Gulab Jamun', u: '1 piece', k: 150, p: 2, c: 22, f: 6 }
  ].sort((a, b) => a.n.localeCompare(b.n));

  const TYPES = [
    { id: 'breakfast', label: '🌅 Breakfast' },
    { id: 'lunch', label: '☀️ Lunch' },
    { id: 'snack', label: '🍎 Snack' },
    { id: 'dinner', label: '🌙 Dinner' }
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
  function todayStr() { return fmt(new Date()); }
  function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function r1(n) { return Math.round(n * 10) / 10; }

  let meals = load(KEY, []);

  // ---------- Food dropdown ----------
  const sel = $('mlFood');
  FOODS.forEach((f, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = f.n + ' (' + f.u + ') - ' + f.k + ' kcal';
    sel.appendChild(o);
  });
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = '➕ Custom food item';
  sel.appendChild(custom);

  sel.addEventListener('change', () => {
    $('mlCustom').style.display = sel.value === 'custom' ? 'grid' : 'none';
  });

  // ---------- Targets ----------
  function targets() {
    const p = load('nl_profile', null);
    if (!p || typeof calcPlan !== 'function') return null;
    try {
      const plan = calcPlan(p);
      return { kcal: plan.target, protein: plan.protein };
    } catch (e) { return null; }
  }

  function todaysMeals() {
    return meals.filter((m) => m.date === todayStr());
  }

  // ---------- Render ----------
  function render() {
    const list = todaysMeals();
    const tot = list.reduce((s, m) => {
      s.k += m.kcal; s.p += m.p; s.c += m.c; s.f += m.f;
      return s;
    }, { k: 0, p: 0, c: 0, f: 0 });
    const t = targets();

    $('mlKcal').textContent = Math.round(tot.k) + (t ? ' / ' + t.kcal : '') + ' kcal';
    $('mlProt').textContent = r1(tot.p) + (t ? ' / ' + t.protein : '') + ' g';
    $('mlCarb').textContent = r1(tot.c) + ' g';
    $('mlFat').textContent = r1(tot.f) + ' g';

    if (t) {
      const kp = Math.min(100, Math.round((tot.k / t.kcal) * 100));
      const pp = Math.min(100, Math.round((tot.p / t.protein) * 100));
      $('mlKcalBar').style.width = kp + '%';
      $('mlProtBar').style.width = pp + '%';
      const left = t.kcal - Math.round(tot.k);
      $('mlKcalNote').textContent = left >= 0
        ? left + ' kcal remaining in calorie target'
        : Math.abs(left) + ' kcal over daily target';
      $('mlProtNote').textContent = 'Protein: ' + pp + '% of target completed';
    } else {
      $('mlKcalBar').style.width = '0%';
      $('mlProtBar').style.width = '0%';
      $('mlKcalNote').textContent = 'Complete your profile above to view your calorie target.';
      $('mlProtNote').textContent = '';
    }

    const box = $('mlList');
    box.innerHTML = '';
    if (list.length === 0) {
      const p = document.createElement('p');
      p.className = 'meal-empty';
      p.textContent = 'No meals logged today. Select a food item above and click Add.';
      box.appendChild(p);
      return;
    }

    TYPES.forEach((type) => {
      const group = list.filter((m) => m.type === type.id);
      if (group.length === 0) return;
      const sum = group.reduce((s, m) => s + m.kcal, 0);

      const h = document.createElement('h4');
      h.className = 'meal-group';
      h.textContent = type.label + ' - ' + Math.round(sum) + ' kcal';
      box.appendChild(h);

      const ul = document.createElement('ul');
      ul.className = 'meal-list';
      group.forEach((m) => {
        const li = document.createElement('li');

        const info = document.createElement('div');
        info.className = 'plan-info';
        const name = document.createElement('strong');
        name.textContent = m.name;
        const meta = document.createElement('span');
        meta.textContent = m.servings + ' x ' + m.unit + '  |  P ' + r1(m.p) + 'g  C ' + r1(m.c) + 'g  F ' + r1(m.f) + 'g';
        info.appendChild(name);
        info.appendChild(meta);

        const right = document.createElement('div');
        right.className = 'plan-actions';
        const kc = document.createElement('span');
        kc.className = 'meal-kcal';
        kc.textContent = Math.round(m.kcal) + ' kcal';
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'history-del';
        del.textContent = '✕';
        del.title = 'Remove';
        del.addEventListener('click', () => {
          meals = meals.filter((x) => x.id !== m.id);
          save(KEY, meals);
          render();
        });
        right.appendChild(kc);
        right.appendChild(del);

        li.appendChild(info);
        li.appendChild(right);
        ul.appendChild(li);
      });
      box.appendChild(ul);
    });
  }

  // ---------- Add meal ----------
  function showMsg(text, ok) {
    const el = $('mlMsg');
    el.style.color = ok ? '#4ade80' : '#ff6b6b';
    el.textContent = text;
  }

  $('mealForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const servings = parseFloat($('mlServings').value);
    if (!isFinite(servings) || servings < 0.25 || servings > 20) {
      showMsg('Enter quantity between 0.25 and 20.'); return;
    }

    let food;
    if (sel.value === 'custom') {
      const name = $('mlCName').value.trim();
      const k = parseFloat($('mlCKcal').value);
      const p = parseFloat($('mlCProt').value) || 0;
      const c = parseFloat($('mlCCarb').value) || 0;
      const f = parseFloat($('mlCFat').value) || 0;
      if (!name) { showMsg('Enter the food name.'); return; }
      if (!isFinite(k) || k < 0 || k > 3000) { showMsg('Enter calories between 0 and 3000 (per serving).'); return; }
      if (p < 0 || c < 0 || f < 0 || p > 500 || c > 500 || f > 500) { showMsg('Enter valid protein/carbs/fat values.'); return; }
      food = { n: name, u: 'serving', k: k, p: p, c: c, f: f };
    } else {
      food = FOODS[parseInt(sel.value, 10)];
      if (!food) { showMsg('Please select a food item.'); return; }
    }

    meals.push({
      id: uid(),
      date: todayStr(),
      type: $('mlType').value,
      name: food.n,
      unit: food.u,
      servings: servings,
      kcal: food.k * servings,
      p: food.p * servings,
      c: food.c * servings,
      f: food.f * servings
    });

    const cut = new Date();
    cut.setDate(cut.getDate() - 30);
    const cutStr = fmt(cut);
    meals = meals.filter((m) => m.date >= cutStr);

    save(KEY, meals);
    $('mlServings').value = '1';
    $('mlCName').value = '';
    $('mlCKcal').value = '';
    $('mlCProt').value = '';
    $('mlCCarb').value = '';
    $('mlCFat').value = '';
    showMsg('Meal added ✔', true);
    render();
  });

  // ---------- Send calories to Daily Tracker ----------
  $('mlToTracker').addEventListener('click', () => {
    const total = Math.round(todaysMeals().reduce((s, m) => s + m.kcal, 0));
    const input = $('dtCalories');
    if (!input) { showMsg('Daily tracker not found.'); return; }
    input.value = total;
    input.dispatchEvent(new Event('input'));
    showMsg('Filled ' + total + ' kcal in Daily Tracker. Click "Save Today\'s Log" there.', true);
    const form = $('dailyForm');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- Start ----------
  $('mlDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  render();
  setInterval(render, 3000);
})();