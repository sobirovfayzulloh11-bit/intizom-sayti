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

// ==== SERVER BILAN SINXRONLASH ====
async function loadServerData(){
  try {
    const res = await fetch('/api/data');
    if(!res.ok) return;
    const result = await res.json();
    if(result.data && Object.keys(result.data).length > 0){
      applyAllData(result.data);
    }
  } catch(err){}
}

async function syncToServer(){
  try {
    const data = collectAllData();
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch(err){}
}

const _origCloseAuthGate = closeAuthGate;
closeAuthGate = async function(username){
  await loadServerData();
  _origCloseAuthGate(username);
  refreshHomeStats();
  syncToServer();
};

const _origCheckAuthStatus = checkAuthStatus;
checkAuthStatus = async function(){
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if(data.loggedIn){
      await loadServerData();
      authGate.style.display = 'none';
      homeScreen.classList.add('active');
      if(authStatus) authStatus.textContent = 'Salom, ' + data.username;
      if(logoutBtn) logoutBtn.style.display = 'inline-block';
      refreshHomeStats();
    } else {
      authGate.style.display = 'flex';
      homeScreen.classList.remove('active');
    }
  } catch(err){}
};

const _origUpdateOverallSync = updateOverall;
updateOverall = function(){
  _origUpdateOverallSync();
  syncToServer();
};

if(challengeBtn){
  challengeBtn.addEventListener('click', function(){
    setTimeout(syncToServer, 100);
  });
}

checkAuthStatus();

// ==== LENTA (FEED) ====
const feedBtn = document.getElementById('feedBtn');
const feedBack = document.getElementById('feedBack');
const feedScreen = document.getElementById('feed');
const feedList = document.getElementById('feedList');
const postImageBtn = document.getElementById('postImageBtn');
const postImageInput = document.getElementById('postImageInput');
const postPreview = document.getElementById('postPreview');
const postCaption = document.getElementById('postCaption');
const postSubmit = document.getElementById('postSubmit');

let selectedImageBase64 = null;

function resizeImage(file, maxSize){
  return new Promise(function(resolve){
    const reader = new FileReader();
    reader.onload = function(e){
      const img = new Image();
      img.onload = function(){
        let w = img.width, h = img.height;
        if(w > h && w > maxSize){ h = h * maxSize / w; w = maxSize; }
        else if(h > maxSize){ w = w * maxSize / h; h = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if(feedBtn) feedBtn.addEventListener('click', async function(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  feedScreen.classList.add('active');
  window.scrollTo(0,0);
  await loadFeed();
});

if(feedBack) feedBack.addEventListener('click', function(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('home').classList.add('active');
  window.scrollTo(0,0);
});

if(postImageBtn) postImageBtn.addEventListener('click', function(){
  postImageInput.click();
});

if(postImageInput) postImageInput.addEventListener('change', async function(e){
  const file = e.target.files[0];
  if(!file) return;
  selectedImageBase64 = await resizeImage(file, 800);
  postPreview.src = selectedImageBase64;
  postPreview.style.display = 'block';
});

if(postSubmit) postSubmit.addEventListener('click', async function(){
  if(!selectedImageBase64){
    alert('Iltimos, rasm tanlang');
    return;
  }
  postSubmit.disabled = true;
  postSubmit.textContent = 'Yuklanmoqda...';
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: selectedImageBase64, caption: postCaption.value.trim() })
    });
    const data = await res.json();
    if(!res.ok){
      alert(data.error || 'Xatolik yuz berdi');
    } else {
      selectedImageBase64 = null;
      postPreview.style.display = 'none';
      postCaption.value = '';
      await loadFeed();
    }
  } catch(err){
    alert('Server bilan boglanishda xatolik');
  }
  postSubmit.disabled = false;
  postSubmit.textContent = 'Ulashish';
});

async function loadFeed(){
  feedList.innerHTML = '<p style="text-align:center;color:var(--text-faint);">Yuklanmoqda...</p>';
  try {
    const res = await fetch('/api/posts');
    const data = await res.json();
    feedList.innerHTML = '';
    if(!data.posts || data.posts.length === 0){
      feedList.innerHTML = '<p style="text-align:center;color:var(--text-faint);">Hali postlar yoq</p>';
      return;
    }
    data.posts.forEach(function(post){
      const div = document.createElement('div');
      div.className = 'feed-post';
      const avatarSrc = post.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%231a1a1e"/%3E%3C/svg%3E';
      div.innerHTML =
        '<div class="feed-post-head">' +
          '<img class="feed-avatar" src="' + avatarSrc + '">' +
          '<div><div class="feed-username">' + post.username + '</div>' +
          '<div class="feed-time">' + post.created_at + '</div></div>' +
        '</div>' +
        '<img class="feed-image" src="' + post.image + '">' +
        (post.caption ? '<div class="feed-caption">' + post.caption + '</div>' : '');
      feedList.appendChild(div);
    });
  } catch(err){
    feedList.innerHTML = '<p style="text-align:center;color:var(--text-faint);">Xatolik yuz berdi</p>';
  }
}

// ==== PROFIL SAHIFASI ====
const myProfileBtn = document.getElementById('myProfileBtn');
const profileBack = document.getElementById('profileBack');
const profilePage = document.getElementById('profilePage');
const profileCover = document.getElementById('profileCover');
const profileAvatarImg = document.getElementById('profileAvatarImg');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profilePostCount = document.getElementById('profilePostCount');
const profileEditControls = document.getElementById('profileEditControls');
const profileGrid = document.getElementById('profileGrid');
const avatarInput = document.getElementById('avatarInput');
const coverInput = document.getElementById('coverInput');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const changeCoverBtn = document.getElementById('changeCoverBtn');
const bioInput = document.getElementById('bioInput');
const saveBioBtn = document.getElementById('saveBioBtn');

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%231a1a1e"/%3E%3C/svg%3E';

function showProfileScreen(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  profilePage.classList.add('active');
  window.scrollTo(0,0);
}

async function loadMyProfile(){
  showProfileScreen();
  profileEditControls.style.display = 'flex';
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();
    renderProfile(data, true);
    const postsRes = await fetch('/api/posts');
    const postsData = await postsRes.json();
    const myPosts = (postsData.posts || []).filter(p => p.username === data.username);
    renderProfileGrid(myPosts);
  } catch(err){}
}

async function loadUserProfile(username){
  showProfileScreen();
  profileEditControls.style.display = 'none';
  try {
    const res = await fetch('/api/profile/user?username=' + encodeURIComponent(username));
    const data = await res.json();
    if(data.error){ alert(data.error); return; }
    renderProfile(data, false);
    renderProfileGrid(data.posts || []);
  } catch(err){}
}

function renderProfile(data, editable){
  profileCover.style.backgroundImage = data.cover ? 'url(' + data.cover + ')' : 'none';
  profileAvatarImg.src = data.avatar || DEFAULT_AVATAR;
  profileUsername.textContent = data.username;
  profileBio.textContent = data.bio || '';
  profilePostCount.textContent = (data.postCount || 0) + ' ta post';
  if(editable) bioInput.value = data.bio || '';
}

function renderProfileGrid(posts){
  profileGrid.innerHTML = '';
  if(!posts || posts.length === 0){
    profileGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-faint);">Hali postlar yoq</p>';
    return;
  }
  posts.forEach(function(p){
    const img = document.createElement('img');
    img.src = p.image;
    profileGrid.appendChild(img);
  });
}

if(myProfileBtn) myProfileBtn.addEventListener('click', loadMyProfile);
if(profileBack) profileBack.addEventListener('click', function(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('home').classList.add('active');
  window.scrollTo(0,0);
});

if(changeAvatarBtn) changeAvatarBtn.addEventListener('click', function(){ avatarInput.click(); });
if(changeCoverBtn) changeCoverBtn.addEventListener('click', function(){ coverInput.click(); });

if(avatarInput) avatarInput.addEventListener('change', async function(e){
  const file = e.target.files[0];
  if(!file) return;
  const base64 = await resizeImage(file, 300);
  profileAvatarImg.src = base64;
  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: base64 })
  });
});

if(coverInput) coverInput.addEventListener('change', async function(e){
  const file = e.target.files[0];
  if(!file) return;
  const base64 = await resizeImage(file, 900);
  profileCover.style.backgroundImage = 'url(' + base64 + ')';
  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cover: base64 })
  });
});

if(saveBioBtn) saveBioBtn.addEventListener('click', async function(){
  await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio: bioInput.value.trim() })
  });
  profileBio.textContent = bioInput.value.trim();
  alert('Bio saqlandi!');
});

// Lentada username bosilganda profil ochilishi
const _origLoadFeed = loadFeed;
loadFeed = async function(){
  await _origLoadFeed();
  document.querySelectorAll('.feed-username').forEach(function(el){
    el.classList.add('feed-username-link');
    el.addEventListener('click', function(){
      loadUserProfile(el.textContent);
    });
  });
};
