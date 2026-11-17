// ===== New Life - app.js (key-safe version, AI /api/chat se chalta hai) =====
console.log('app.js loaded OK');

const $ = (id) => document.getElementById(id);

// ---------- Storage helpers ----------
const KEYS = { profile: 'nl_profile', workouts: 'nl_workouts', water: 'nl_water' };

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ---------- State ----------
let profile = load(KEYS.profile, null);
let workouts = load(KEYS.workouts, []);
let water = load(KEYS.water, { date: todayStr(), ml: 0 });
if (water.date !== todayStr()) {
  water = { date: todayStr(), ml: 0 };
  save(KEYS.water, water);
}

// ---------- Calculations (Mifflin-St Jeor) ----------
const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
const GOAL_LABEL = {
  lose: 'Weight / fat kam karna',
  maintain: 'Fit rehna',
  gain: 'Muscle / weight badhana'
};

function calcPlan(p) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.gender === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[p.activity];

  let target = tdee;
  if (p.goal === 'lose' && p.age >= 18) target -= 500;
  if (p.goal === 'gain') target += 300;

  const floor = p.gender === 'male' ? 1500 : 1200;
  target = Math.max(Math.round(target), floor);

  let waterL = p.weight * 0.035;
  if (p.activity === 'moderate') waterL += 0.25;
  if (p.activity === 'active') waterL += 0.5;
  waterL = Math.round(waterL * 10) / 10;

  const protein = Math.round(p.weight * (p.goal === 'gain' ? 2 : 1.6));
  const bmi = p.weight / Math.pow(p.height / 100, 2);

  let bmiLabel = 'Normal';
  if (bmi < 18.5) bmiLabel = 'Underweight';
  else if (bmi >= 30) bmiLabel = 'Obese range';
  else if (bmi >= 25) bmiLabel = 'Overweight';

  return { target, waterL, protein, bmi: bmi.toFixed(1), bmiLabel };
}

// ---------- Onboarding popup ----------
const onboarding = $('onboarding');
const profileForm = $('profileForm');
const cancelProfile = $('cancelProfile');

profileForm.setAttribute('novalidate', '');

const profileError = document.createElement('p');
profileError.style.cssText = 'color:#ff6b6b;font-size:0.85rem;margin:0 0 12px;min-height:1.2em;';
profileForm.insertBefore(profileError, profileForm.querySelector('button[type="submit"]'));

function openOnboarding() {
  profileError.textContent = '';
  if (profile) {
    $('pName').value = profile.name;
    $('pAge').value = profile.age;
    $('pGender').value = profile.gender;
    $('pHeight').value = profile.height;
    $('pWeight').value = profile.weight;
    $('pGoal').value = profile.goal;
    $('pActivity').value = profile.activity;
  }
  cancelProfile.style.display = profile ? 'block' : 'none';
  onboarding.classList.remove('hidden');
}
function closeOnboarding() {
  onboarding.classList.add('hidden');
}

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = $('pName').value.trim();
  const age = parseFloat($('pAge').value);
  const height = parseFloat($('pHeight').value);
  const weight = parseFloat($('pWeight').value);

  if (!name) { profileError.textContent = 'Apna naam daalo.'; return; }
  if (!isFinite(age) || age < 14 || age > 90) { profileError.textContent = 'Age 14 se 90 ke beech daalo.'; return; }
  if (!isFinite(height) || height < 120 || height > 230) { profileError.textContent = 'Height cm mein daalo (120 se 230), jaise 170.'; return; }
  if (!isFinite(weight) || weight < 30 || weight > 250) { profileError.textContent = 'Weight kg mein daalo (30 se 250), jaise 70.'; return; }

  profileError.textContent = '';

  profile = {
    name: name,
    age: Math.round(age),
    gender: $('pGender').value,
    height: height,
    weight: weight,
    goal: $('pGoal').value,
    activity: $('pActivity').value
  };
  save(KEYS.profile, profile);
  closeOnboarding();
  renderAll();
});

cancelProfile.addEventListener('click', closeOnboarding);
$('editProfileBtn').addEventListener('click', openOnboarding);

// ---------- Rendering ----------
function todaysWorkouts() {
  return workouts.filter((w) => w.date === todayStr());
}

function estimateBurn() {
  const w = profile ? profile.weight : 70;
  const total = todaysWorkouts().reduce((sum, x) => sum + x.sets * x.reps * 0.5 * (w / 70), 0);
  return Math.round(total);
}

function renderProfile() {
  if (!profile) {
    $('profileBar').style.display = 'none';
    return;
  }
  const plan = calcPlan(profile);
  $('profileBar').style.display = 'flex';
  $('profileName').textContent = 'Hi ' + profile.name + ' 👋';
  $('profileInfo').textContent =
    'Goal: ' + GOAL_LABEL[profile.goal] +
    '  |  BMI: ' + plan.bmi + ' (' + plan.bmiLabel + ')' +
    '  |  Protein target: ~' + plan.protein + ' g/day';
}

function renderStats() {
  if (profile) {
    const plan = calcPlan(profile);
    $('calTargetVal').innerHTML = plan.target + ' <small>kcal</small>';
    $('calTargetSub').textContent = GOAL_LABEL[profile.goal];

    const liters = (water.ml / 1000).toFixed(2);
    $('waterVal').innerHTML = liters + ' <small>/ ' + plan.waterL + ' L</small>';
    const pct = Math.min(100, Math.round((water.ml / (plan.waterL * 1000)) * 100));
    $('waterBar').style.width = pct + '%';
  } else {
    $('calTargetVal').innerHTML = '-- <small>kcal</small>';
    $('calTargetSub').textContent = 'Profile bharo';
    $('waterVal').innerHTML = (water.ml / 1000).toFixed(2) + ' <small>L</small>';
    $('waterBar').style.width = '0%';
  }
  $('calBurnedVal').innerHTML = estimateBurn() + ' <small>kcal</small>';
  $('workoutVal').innerHTML = todaysWorkouts().length + ' <small>exercises</small>';
}

function renderWorkouts() {
  const list = $('workoutList');
  list.innerHTML = '';
  todaysWorkouts().forEach((w) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    const strong = document.createElement('strong');
    const detail = document.createElement('span');
    strong.textContent = w.exercise;
    name.appendChild(strong);
    detail.textContent = w.sets + ' Sets x ' + w.reps + ' Reps';
    li.appendChild(name);
    li.appendChild(detail);
    list.appendChild(li);
  });
}

function renderAll() {
  renderProfile();
  renderStats();
  renderWorkouts();
}

// ---------- Water ----------
$('addWaterBtn').addEventListener('click', () => {
  water.ml += 250;
  save(KEYS.water, water);
  renderStats();
});
$('undoWaterBtn').addEventListener('click', () => {
  water.ml = Math.max(0, water.ml - 250);
  save(KEYS.water, water);
  renderStats();
});

// ---------- Workout logger ----------
$('workoutForm').addEventListener('submit', (e) => {
  e.preventDefault();
  workouts.push({
    exercise: $('exerciseInput').value.trim(),
    sets: Number($('setsInput').value),
    reps: Number($('repsInput').value),
    date: todayStr()
  });
  save(KEYS.workouts, workouts);
  $('workoutForm').reset();
  renderAll();
});

// ---------- AI Coach (key server par safe hai, yahan nahi) ----------
const askAiBtn = $('askAiBtn');
const aiInput = $('aiInput');
const chatBox = $('chatBox');

function appendMessage(text, className) {
  const div = document.createElement('div');
  div.className = className;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function buildProfileInfo() {
  if (!profile) return '';
  const plan = calcPlan(profile);
  return ' User profile: name ' + profile.name +
    ', age ' + profile.age +
    ', gender ' + profile.gender +
    ', height ' + profile.height + ' cm' +
    ', weight ' + profile.weight + ' kg' +
    ', goal: ' + GOAL_LABEL[profile.goal] +
    ', daily calorie target ' + plan.target + ' kcal' +
    ', protein target ' + plan.protein + ' g. Personalize advice to this profile.';
}

async function askAI() {
  const query = aiInput.value.trim();
  if (!query) return;

  askAiBtn.disabled = true;
  askAiBtn.style.opacity = '0.5';

  appendMessage(query, 'user-msg');
  aiInput.value = '';
  const loadingMsg = appendMessage('New Life AI is thinking...', 'bot-msg');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ query: query, profile: buildProfileInfo() })
    });

    clearTimeout(timeoutId);

    let data = null;
    try { data = await response.json(); } catch (e) {}

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('AI sirf online site par chalta hai (Vercel link se kholo).');
      }
      throw new Error((data && data.error && data.error.message) || 'Server Busy');
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    loadingMsg.textContent = reply || 'Sorry, reply generation fail ho gaya.';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      loadingMsg.textContent = 'Network slow tha. Kripya dobara try karein.';
    } else {
      loadingMsg.textContent = 'Error: ' + error.message;
    }
  } finally {
    askAiBtn.disabled = false;
    askAiBtn.style.opacity = '1';
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

askAiBtn.addEventListener('click', askAI);
aiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') askAI();
});

// ---------- Planner se workout add karne ke liye ----------
window.nlAddWorkout = function (exercise, sets, reps) {
  workouts.push({
    exercise: exercise,
    sets: Number(sets),
    reps: Number(reps),
    date: todayStr()
  });
  save(KEYS.workouts, workouts);
  renderAll();
};

// ---------- Start ----------
renderAll();
if (!profile) openOnboarding();