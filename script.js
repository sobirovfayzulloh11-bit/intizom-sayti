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
