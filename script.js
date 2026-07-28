const PRESETS = {
  erta: [
    ["06:00","Uyg'onish va yotoqni yig'ish"],
    ["06:15","Bir stakan suv ichish"],
    ["06:30","10 daqiqalik cho'zilish mashqlari"],
    ["07:00","Sog'lom nonushta"]
  ],
  sport: [
    ["07:00","Isinish mashqlari (5 daq)"],
    ["07:10","Yugurish yoki tez yurish (20 daq)"],
    ["18:00","Kuch mashqlari"],
    ["21:00","Cho'zilish va tinchlanish"]
  ],
  ilm: [
    ["08:00","30 daqiqa kitob o'qish"],
    ["13:00","Onlayn kurs yoki video dars"],
    ["19:00","O'rganilganlarni konspekt qilish"],
    ["20:00","Yangi bilim yozib qo'yish"]
  ],
  chalg: [
    ["09:00","Telefonni faqat zarur vaqtda ochish"],
    ["12:00","Ijtimoiy tarmoqqa 30 daqiqa limit"],
    ["20:00","Ekrandan uzoqlashish (uxlashdan 1 soat oldin)"],
    ["22:00","Telefonni boshqa xonaga qo'yish"]
  ]
};

function todayKey(cat){
  const d = new Date().toISOString().slice(0,10);
  return 'intizom_' + cat + '_' + d;
}

function loadSchedule(cat){
  const raw = localStorage.getItem(todayKey(cat));
  return raw ? JSON.parse(raw) : [];
}

function saveSchedule(cat, items){
  localStorage.setItem(todayKey(cat), JSON.stringify(items));
}

function renderCategory(screen){
  const cat = screen.dataset.category;
  const items = loadSchedule(cat);
  const list = screen.querySelector('.schedule-list');
  list.innerHTML = '';

  items.forEach(function(item, i){
    const row = document.createElement('div');
    row.className = 'sched-item';
    row.innerHTML =
      '<input type="checkbox" ' + (item.done ? 'checked' : '') + '>' +
      '<span class="sched-time">' + item.time + '</span>' +
      '<span class="sched-text">' + item.text + '</span>' +
      '<button class="sched-del">✕</button>';

    row.querySelector('input').addEventListener('change', function(e){
      items[i].done = e.target.checked;
      saveSchedule(cat, items);
      updateProgress(screen, items);
      updateOverall();
    });

    row.querySelector('.sched-del').addEventListener('click', function(){
      items.splice(i,1);
      saveSchedule(cat, items);
      renderCategory(screen);
      updateOverall();
    });

    list.appendChild(row);
  });

  updateProgress(screen, items);
}

function updateProgress(screen, items){
  const total = items.length;
  const done = items.filter(i => i.done).length;
  const pct = total ? (done/total*100) : 0;
  screen.querySelector('.progress-fill').style.width = pct + '%';
  screen.querySelector('.progress-label').textContent = done + ' / ' + total;
}

function updateOverall(){
  let total = 0, done = 0;
  document.querySelectorAll('.screen[data-category]').forEach(function(screen){
    const items = loadSchedule(screen.dataset.category);
    total += items.length;
    done += items.filter(i => i.done).length;
  });
  const pct = total ? (done/total*100) : 0;
  document.getElementById('overallFill').style.width = pct + '%';
  document.getElementById('overallLabel').textContent = done + ' / ' + total;
}

// Navigatsiya
document.querySelectorAll('.card').forEach(function(card){
  card.addEventListener('click', function(){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(card.dataset.target);
    target.classList.add('active');
    renderCategory(target);
    window.scrollTo(0,0);
  });
});

document.querySelectorAll('.back-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('home').classList.add('active');
    updateOverall();
    window.scrollTo(0,0);
  });
});

// Preset tugmasi
document.querySelectorAll('.preset-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    const screen = btn.closest('.screen');
    const cat = screen.dataset.category;
    const preset = PRESETS[cat].map(p => ({time:p[0], text:p[1], done:false}));
    saveSchedule(cat, preset);
    renderCategory(screen);
    updateOverall();
  });
});

// Qo'shish formasi
document.querySelectorAll('.add-form').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const screen = form.closest('.screen');
    const cat = screen.dataset.category;
    const time = form.querySelector('.add-time').value;
    const text = form.querySelector('.add-text').value.trim();
    if(!time || !text) return;
    const items = loadSchedule(cat);
    items.push({time, text, done:false});
    items.sort((a,b) => a.time.localeCompare(b.time));
    saveSchedule(cat, items);
    renderCategory(screen);
    updateOverall();
    form.reset();
  });
});

updateOverall();

// ==== BILDIRISHNOMALAR ====
const notifyBtn = document.getElementById('notifyBtn');
const notifyStatus = document.getElementById('notifyStatus');

function refreshNotifyStatus(){
  if(!('Notification' in window)){
    notifyStatus.textContent = 'Bu brauzer bildirishnomani qo\'llab-quvvatlamaydi';
    return;
  }
  if(Notification.permission === 'granted'){
    notifyStatus.textContent = 'Bildirishnomalar yoqilgan';
  } else if(Notification.permission === 'denied'){
    notifyStatus.textContent = 'Bildirishnoma ruxsati rad etilgan';
  } else {
    notifyStatus.textContent = '';
  }
}

if(notifyBtn){
  notifyBtn.addEventListener('click', function(){
    if(!('Notification' in window)){
      alert('Bu brauzer bildirishnomani qo\'llab-quvvatlamaydi');
      return;
    }
    Notification.requestPermission().then(refreshNotifyStatus);
  });
  refreshNotifyStatus();
}

const VIRTUE_MESSAGE = "Erta turish — tongning barakasidan bahramand bo'lish uchun ajoyib fursat. Kuningizni tinchlik va shukur bilan boshlang.";

function pad(n){ return n < 10 ? '0'+n : ''+n; }

function checkSchedules(){
  if(!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const current = pad(now.getHours()) + ':' + pad(now.getMinutes());

  document.querySelectorAll('.screen[data-category]').forEach(function(screen){
    const cat = screen.dataset.category;
    const items = loadSchedule(cat);
    let changed = false;

    items.forEach(function(item){
      if(item.time === current && !item.done && !item.notified){
        let body = item.text;
        if(cat === 'erta'){
          body = item.text + '. ' + VIRTUE_MESSAGE;
        }
        new Notification('Reja vaqti keldi', { body: body });
        item.notified = true;
        changed = true;
      }
    });

    if(changed) saveSchedule(cat, items);
  });
}

setInterval(checkSchedules, 20000);

// ==== KUNLIK ILHOM ====
const QUOTES = [
  "Kichik qadamlar, katta natijalar yaratadi.",
  "Intizom — bugungi kunni ertangi men uchun sovg'a qilishdir.",
  "Har kuni ozgina yaxshiroq bo'lish, uzoq muddatda buyuk o'zgarish beradi.",
  "Boshlash qiyin, lekin davom etish g'alaba keltiradi.",
  "Vaqtingizni himoya qiling — u qaytmaydigan boylik.",
  "Odat — kelajagingizni quradigan g'isht.",
  "Bugungi kichik harakat, ertangi katta natija.",
  "O'zingizga bergan va'dangizni bajaring — bu ishonchning boshlanishi."
];

function dailyQuote(){
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

const quoteEl = document.getElementById('dailyQuote');
if(quoteEl) quoteEl.textContent = dailyQuote();

// ==== GLOBAL LOG (streak va grafik uchun) ====
function dateStr(offsetDays){
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0,10);
}

function loadLog(){
  const raw = localStorage.getItem('intizom_log');
  return raw ? JSON.parse(raw) : {};
}

function saveLog(log){
  localStorage.setItem('intizom_log', JSON.stringify(log));
}

function updateTodayLog(done, total){
  const log = loadLog();
  log[dateStr(0)] = { done: done, total: total };
  saveLog(log);
  return log;
}

function computeStreak(log){
  let streak = 0;
  let i = 0;
  while(true){
    const key = dateStr(i);
    if(log[key] && log[key].done > 0){
      streak++;
      i++;
    } else {
      break;
    }
  }
  return streak;
}

function computeBest(log, current){
  const stored = parseInt(localStorage.getItem('intizom_best') || '0', 10);
  const best = Math.max(stored, current);
  localStorage.setItem('intizom_best', String(best));
  return best;
}

function renderWeekChart(log){
  const container = document.getElementById('weekBars');
  if(!container) return;
  container.innerHTML = '';
  const days = ['Ya','Du','Se','Ch','Pa','Ju','Sh'];
  for(let i = 6; i >= 0; i--){
    const key = dateStr(i);
    const entry = log[key];
    const pct = entry && entry.total ? Math.round(entry.done / entry.total * 100) : 0;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML =
      '<div class="bar-fill" style="height:' + Math.max(pct,3) + '%"></div>' +
      '<span class="bar-day">' + days[d.getDay()] + '</span>';
    container.appendChild(col);
  }
}

const ACHIEVEMENTS = [
  { id:'first', label:"Birinchi qadam — birinchi vazifani bajarding", check: (log) => Object.values(log).reduce((a,e)=>a+e.done,0) >= 1 },
  { id:'streak3', label:"Barqaror boshlanish — 3 kunlik streak", check: (log, streak) => streak >= 3 },
  { id:'streak7', label:"Bir hafta intizom — 7 kunlik streak", check: (log, streak) => streak >= 7 },
  { id:'done20', label:"Yigirmalik — jami 20 ta vazifa bajarildi", check: (log) => Object.values(log).reduce((a,e)=>a+e.done,0) >= 20 },
  { id:'streak30', label:"Bir oylik yo'l — 30 kunlik streak", check: (log, streak) => streak >= 30 }
];

function renderAchievements(log, streak){
  const list = document.getElementById('badgeList');
  if(!list) return;
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(function(a){
    const unlocked = a.check(log, streak);
    const div = document.createElement('div');
    div.className = 'badge' + (unlocked ? ' unlocked' : '');
    div.innerHTML = '<span class="badge-dot"></span><span class="badge-text">' + a.label + '</span>';
    list.appendChild(div);
  });
}

function refreshHomeStats(){
  let total = 0, done = 0;
  document.querySelectorAll('.screen[data-category]').forEach(function(screen){
    const items = loadSchedule(screen.dataset.category);
    total += items.length;
    done += items.filter(i => i.done).length;
  });

  const log = updateTodayLog(done, total);
  const streak = computeStreak(log);
  const best = computeBest(log, streak);

  const curEl = document.getElementById('currentStreak');
  const bestEl = document.getElementById('bestStreak');
  if(curEl) curEl.textContent = streak;
  if(bestEl) bestEl.textContent = best;

  renderWeekChart(log);
  renderAchievements(log, streak);
}

const _origUpdateOverall = updateOverall;
updateOverall = function(){
  _origUpdateOverall();
  refreshHomeStats();
};

// ==== ULASHISH ====
const shareBtn = document.getElementById('shareBtn');
if(shareBtn){
  shareBtn.addEventListener('click', function(){
    const label = document.getElementById('overallLabel').textContent;
    const streak = document.getElementById('currentStreak').textContent;
    const text = "Men Intizom saytida bugun " + label + " vazifani bajardim, joriy streak: " + streak + " kun! " + window.location.href;
    if(navigator.share){
      navigator.share({ title:'Intizom', text: text }).catch(function(){});
    } else {
      navigator.clipboard.writeText(text).then(function(){
        alert('Natija nusxalandi, do\'stingizga yuborishingiz mumkin!');
      });
    }
  });
}

refreshHomeStats();

// ==== ZAXIRA (EXPORT/IMPORT) ====
function collectAllData(){
  const data = { schedules:{}, log: loadLog(), best: localStorage.getItem('intizom_best') || '0' };
  ['erta','sport','ilm','chalg'].forEach(function(cat){
    data.schedules[cat] = loadSchedule(cat);
  });
  return data;
}

function applyAllData(data){
  if(data.schedules){
    Object.keys(data.schedules).forEach(function(cat){
      saveSchedule(cat, data.schedules[cat]);
    });
  }
  if(data.log) saveLog(data.log);
  if(data.best) localStorage.setItem('intizom_best', data.best);
}

const exportBtn = document.getElementById('exportBtn');
if(exportBtn){
  exportBtn.addEventListener('click', function(){
    const data = collectAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intizom-zaxira-' + dateStr(0) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
if(importBtn && importFile){
  importBtn.addEventListener('click', function(){
    importFile.click();
  });
  importFile.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      try {
        const data = JSON.parse(ev.target.result);
        applyAllData(data);
        alert('Zaxira muvaffaqiyatli tiklandi!');
        location.reload();
      } catch(err){
        alert('Fayl noto\'g\'ri formatda. Faqat Intizom zaxira faylini tanlang.');
      }
    };
    reader.readAsText(file);
  });
}

// ==== KUNLIK CHALLENGE ====
const CHALLENGES = [
  "Bugun 5 daqiqa jim o'tirib, chuqur nafas oling.",
  "Bugun birontasiga samimiy rahmat ayting.",
  "Bugun telefonni 1 soatga chetga qo'ying.",
  "Bugun ertami turish uchun alarm 30 daqiqaga erta qo'ying.",
  "Bugun yangi bir so'z yoki fakt o'rganing.",
  "Bugun 10 marta o'tirib-turish (squat) qiling.",
  "Bugun kimdirga yordam bering, hech narsa evaziga.",
  "Bugun ijobiy fikr bilan kunni yakunlang — kundalikka yozing.",
  "Bugun sog'lom taomni tanlang, shirinlik o'rniga meva yeng.",
  "Bugun 15 daqiqa piyoda yuring."
];

function todayChallenge(){
  const day = Math.floor(Date.now() / 86400000);
  return CHALLENGES[day % CHALLENGES.length];
}

function challengeKey(){
  return 'intizom_challenge_' + dateStr(0);
}

const challengeText = document.getElementById('challengeText');
const challengeBtn = document.getElementById('challengeBtn');

if(challengeText && challengeBtn){
  challengeText.textContent = todayChallenge();
  const doneToday = localStorage.getItem(challengeKey()) === '1';
  if(doneToday){
    challengeBtn.textContent = 'Bajarildi ✓';
    challengeBtn.classList.add('done');
    challengeBtn.disabled = true;
  }
  challengeBtn.addEventListener('click', function(){
    localStorage.setItem(challengeKey(), '1');
    challengeBtn.textContent = 'Bajarildi ✓';
    challengeBtn.classList.add('done');
    challengeBtn.disabled = true;
    fireConfetti();
  });
}

// ==== CONFETTI ====
function fireConfetti(){
  const layer = document.getElementById('confettiLayer');
  if(!layer) return;
  const colors = ['#ff9a8b','#7877c6','#ffd166','#8bd3ff'];
  for(let i = 0; i < 40; i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    piece.style.width = size + 'px';
    piece.style.height = (size * 0.4) + 'px';
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    layer.appendChild(piece);
    setTimeout(function(){ piece.remove(); }, 4000);
  }
}

// Barcha vazifa bajarilganda confetti
const _origUpdateOverallStats = updateOverall;
updateOverall = function(){
  _origUpdateOverallStats();
  const label = document.getElementById('overallLabel');
  if(label){
    const parts = label.textContent.split(' / ');
    const done = parseInt(parts[0], 10);
    const total = parseInt(parts[1], 10);
    if(total > 0 && done === total){
      const key = 'intizom_confetti_' + dateStr(0);
      if(!localStorage.getItem(key)){
        localStorage.setItem(key, '1');
        fireConfetti();
      }
    }
  }
};

// ==== REVEAL ANIMATSIYA (scroll bilan asta-sekin ko'rinish) ====
function initReveal(){
  const targets = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('in-view'); });
    return;
  }
  const observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(function(el){ observer.observe(el); });
}

initReveal();

// Kategoriya sahifasiga o'tganda ham reveal ishlashi uchun
document.querySelectorAll('.card').forEach(function(card){
  card.addEventListener('click', function(){
    setTimeout(initReveal, 50);
  });
});

// ==== SPLASH EKRANNI YASHIRISH ====
window.addEventListener('load', function(){
  setTimeout(function(){
    const splash = document.getElementById('splashScreen');
    if(splash) splash.classList.add('hide');
  }, 1600);
});


// ==== AUTH GATE ====
const authGate = document.getElementById('authGate');
const gateTabLogin = document.getElementById('gateTabLogin');
const gateTabRegister = document.getElementById('gateTabRegister');
const authForm = document.getElementById('authForm');
const authSubmit = document.getElementById('authSubmit');
const authEmailField = document.getElementById('authEmail');
const authError = document.getElementById('authError');
const authStatus = document.getElementById('authStatus');
const logoutBtn = document.getElementById('logoutBtn');
const homeScreen = document.getElementById('home');

let authMode = 'login';

function setGateMode(mode){
  authMode = mode;
  authError.textContent = '';
  authForm.reset();
  if(mode === 'login'){
    gateTabLogin.classList.add('active');
    gateTabRegister.classList.remove('active');
    authSubmit.textContent = 'Kirish';
    authEmailField.style.display = 'none';
    authEmailField.required = false;
  } else {
    gateTabRegister.classList.add('active');
    gateTabLogin.classList.remove('active');
    authSubmit.textContent = 'Ro\'yxatdan o\'tish';
    authEmailField.style.display = 'block';
    authEmailField.required = true;
  }
}

if(gateTabLogin) gateTabLogin.addEventListener('click', function(){ setGateMode('login'); });
if(gateTabRegister) gateTabRegister.addEventListener('click', function(){ setGateMode('register'); });

if(authForm){
  authForm.addEventListener('submit', async function(e){
    e.preventDefault();
    authError.textContent = '';
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const email = authEmailField.value.trim();

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const payload = authMode === 'login'
      ? { username, password }
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok){
        authError.textContent = data.error || 'Xatolik yuz berdi';
        return;
      }
      if(authMode === 'register'){
        authError.style.color = '#7ba05c';
        authError.textContent = 'Muvaffaqiyatli! Endi kiring.';
        setTimeout(function(){ setGateMode('login'); authError.style.color = ''; }, 1200);
      } else {
        closeAuthGate(data.username);
      }
    } catch(err){
      authError.textContent = 'Server bilan bog\'lanishda xatolik';
    }
  });
}

function closeAuthGate(username){
  authGate.style.opacity = '0';
  authGate.style.pointerEvents = 'none';
  setTimeout(function(){ authGate.style.display = 'none'; }, 500);
  homeScreen.classList.add('active');
  if(authStatus) authStatus.textContent = 'Salom, ' + username;
  if(logoutBtn) logoutBtn.style.display = 'inline-block';
}

if(logoutBtn){
  logoutBtn.addEventListener('click', async function(){
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
  });
}

async function checkAuthStatus(){
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if(data.loggedIn){
      authGate.style.display = 'none';
      homeScreen.classList.add('active');
      if(authStatus) authStatus.textContent = 'Salom, ' + data.username;
      if(logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      authGate.style.display = 'flex';
      homeScreen.classList.remove('active');
    }
  } catch(err){}
}

authGate.style.transition = 'opacity 0.5s ease';
checkAuthStatus();
