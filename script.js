// ─── STATE ───
let currentLang = localStorage.getItem('hmLang') || 'en';
let currentChapter = null;
let currentQuiz = null;
let currentQuestionIdx = 0;
let bookmarks = JSON.parse(localStorage.getItem('hmBookmarks') || '[]');
let expandedFacts = JSON.parse(localStorage.getItem('hmExpanded') || '{}');
let soundEnabled = localStorage.getItem('hmSound') !== 'off';

function getData() { return currentLang === 'ru' ? APP_DATA_RU : APP_DATA; }

// ─── WEB AUDIO ENGINE ───
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    switch (type) {
      case 'heartbeat': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.15);
        // second beat
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65, now + 0.2);
        osc2.frequency.exponentialRampToValueAtTime(45, now + 0.28);
        gain2.gain.setValueAtTime(0.12, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(now + 0.2); osc2.stop(now + 0.35);
        break;
      }
      case 'expand': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.15);
        break;
      }
      case 'bookmark': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }
      case 'quizCorrect': {
        [0, 0.1, 0.2].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523 + i * 130, now + delay);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.15);
        });
        break;
      }
      case 'quizWrong': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
        break;
      }
      case 'quizComplete': {
        [0, 0.15, 0.3, 0.45, 0.6].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const notes = [523, 659, 784, 1047, 1319];
          osc.frequency.setValueAtTime(notes[i] || 1047, now + delay);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.2);
        });
        break;
      }
      case 'search': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }
      case 'random': {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200 + Math.random() * 400, now + i * 0.06);
          gain.gain.setValueAtTime(0.05, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.08);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.08);
        }
        break;
      }
      case 'chapterSwitch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }
      case 'toggleLang': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.1);
        break;
      }
    }
  } catch(e) { /* silent fail */ }
}

// ─── DOM REFS ───
const sidebar = document.getElementById('chapter-list');
const bottomNav = document.getElementById('bottom-nav-list');
const moreList = document.getElementById('more-chapter-list');
const welcome = document.getElementById('welcome-screen');
const chapterContent = document.getElementById('chapter-content');
const chapterHeader = document.getElementById('chapter-header');
const factsContainer = document.getElementById('facts-container');
const quizContainer = document.getElementById('quiz-container');
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const quizModal = document.getElementById('quiz-modal');
const quizHeader = document.getElementById('quiz-header');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const moreModal = document.getElementById('more-modal');
const progressFill = document.getElementById('progress-fill');
const langBtn = document.getElementById('btn-lang');
const headerTitle = document.querySelector('h1');
const headerSub = document.querySelector('.subtitle');
const heartbeatIcon = document.querySelector('.heartbeat-icon');

// ─── UI STRINGS ───
const UI = {
  en: {
    headerTitle: 'The Human Machine',
    headerSub: '100 Shocking & Incredible Facts About Your Body & Brain',
    welcomeTitle: 'The Human Machine',
    welcomeDesc: '100 of the most shocking, incredible, and scientifically verified facts about the human body and brain.',
    chapters: 'Chapters', facts: 'Facts', quiz: 'Quiz Questions',
    startReading: 'Start Reading →',
    search: '🔍 Search 100 Facts',
    searchPlaceholder: 'Search titles, explanations, weird parts...',
    searchType: 'Type to search 100 facts...',
    noResults: 'No results found.',
    allChapters: 'All Chapters',
    facts_: 'facts',
    quizTitle: '📝 Chapter Quiz',
    quizDesc: 'Test your knowledge with 3 questions.',
    startQuiz: 'Start Quiz',
    quizComplete: '🎉 Quiz Complete!',
    closeQuiz: '✕ Close Quiz',
    readMore: '▼ Read More',
    showLess: '▲ Show Less',
    weirdLabel: '🤯 The Weird Part',
    bookmarked: 'Bookmarked!',
    removed: 'Bookmark removed',
    correct: '✅ Correct!',
    incorrect: '❌ Incorrect. The answer was',
    soundOn: '🔊', soundOff: '🔇'
  },
  ru: {
    headerTitle: 'Человеческая Машина',
    headerSub: '100 шокирующих и невероятных фактов о теле и мозге',
    welcomeTitle: 'Человеческая Машина',
    welcomeDesc: '100 самых шокирующих, невероятных и научно подтверждённых фактов о человеческом теле и мозге.',
    chapters: 'Глав', facts: 'Фактов', quiz: 'Вопросов',
    startReading: 'Начать чтение →',
    search: '🔍 Поиск 100 фактов',
    searchPlaceholder: 'Поиск по заголовкам, тексту...',
    searchType: 'Начните печатать для поиска...',
    noResults: 'Ничего не найдено.',
    allChapters: 'Все главы',
    facts_: 'фактов',
    quizTitle: '📝 Тест по главе',
    quizDesc: 'Проверьте знания — 3 вопроса.',
    startQuiz: 'Начать тест',
    quizComplete: '🎉 Тест завершён!',
    closeQuiz: '✕ Закрыть тест',
    readMore: '▼ Читать далее',
    showLess: '▲ Свернуть',
    weirdLabel: '🤯 Самое странное',
    bookmarked: 'В закладки!',
    removed: 'Удалено из закладок',
    correct: '✅ Правильно!',
    incorrect: '❌ Неправильно. Правильный ответ:',
    soundOn: '🔊', soundOff: '🔇'
  }
};
function t(key) { return UI[currentLang][key] || key; }

// ─── INIT ───
function init() {
  document.getElementById('btn-sound').textContent = soundEnabled ? t('soundOn') : t('soundOff');
  langBtn.textContent = currentLang === 'en' ? '🇬🇧' : '🇷🇺';
  langBtn.addEventListener('click', () => { toggleLang(); playSound('toggleLang'); });
  document.getElementById('btn-sound').addEventListener('click', toggleSound);
  renderNav();
  setupEventListeners();
  updateReadingProgress();
  headerTitle.textContent = t('headerTitle');
  headerSub.textContent = t('headerSub');
  // Heartbeat click plays sound
  heartbeatIcon.addEventListener('click', () => playSound('heartbeat'));
  // Init heartbeat loop
  setInterval(() => playSound('heartbeat'), 2800);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('hmSound', soundEnabled ? 'on' : 'off');
  document.getElementById('btn-sound').textContent = soundEnabled ? t('soundOn') : t('soundOff');
  if (soundEnabled) playSound('heartbeat');
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ru' : 'en';
  localStorage.setItem('hmLang', currentLang);
  langBtn.textContent = currentLang === 'en' ? '🇬🇧' : '🇷🇺';
  headerTitle.textContent = t('headerTitle');
  headerSub.textContent = t('headerSub');
  document.getElementById('btn-sound').textContent = soundEnabled ? t('soundOn') : t('soundOff');
  document.querySelector('#welcome-screen h2').textContent = t('welcomeTitle');
  document.querySelector('#welcome-screen p').textContent = t('welcomeDesc');
  document.getElementById('wlcm-chapters').textContent = `10 ${t('chapters')}`;
  document.getElementById('wlcm-facts').textContent = `100 ${t('facts')}`;
  document.getElementById('wlcm-quiz').textContent = `30 ${t('quiz')}`;
  document.getElementById('btn-start').textContent = t('startReading');
  document.querySelector('#search-overlay .overlay-header h2').textContent = t('search');
  searchInput.placeholder = t('searchPlaceholder');
  document.querySelector('#more-modal .overlay-header h2').textContent = t('allChapters');
  if (currentChapter !== null) openChapter(currentChapter);
}

// ─── RENDER NAV ───
function renderNav() {
  sidebar.innerHTML = ''; bottomNav.innerHTML = ''; moreList.innerHTML = '';
  const data = getData();
  data.chapters.forEach((ch, i) => {
    const li = document.createElement('li');
    li.dataset.chapter = i; li.textContent = ch.emoji; li.title = ch.title;
    li.addEventListener('click', () => { playSound('chapterSwitch'); openChapter(i); });
    sidebar.appendChild(li);
    if (i < 5) {
      const bli = document.createElement('li');
      bli.dataset.chapter = i;
      bli.innerHTML = `${ch.emoji}<span class="nav-label">${ch.title.split(' ')[0]}</span>`;
      bli.addEventListener('click', () => { playSound('chapterSwitch'); openChapter(i); });
      bottomNav.appendChild(bli);
    }
    const mli = document.createElement('li');
    mli.dataset.chapter = i;
    mli.innerHTML = `${ch.emoji} ${ch.title}`;
    mli.addEventListener('click', () => { closeMore(); playSound('chapterSwitch'); openChapter(i); });
    moreList.appendChild(mli);
  });
}

function setupEventListeners() {
  document.getElementById('btn-start').addEventListener('click', () => { playSound('chapterSwitch'); openChapter(0); });
  document.getElementById('btn-random').addEventListener('click', () => { playSound('random'); randomFact(); });
  document.getElementById('btn-search').addEventListener('click', () => { playSound('search'); openSearch(); });
  document.getElementById('btn-close-search').addEventListener('click', closeSearch);
  document.getElementById('btn-close-more').addEventListener('click', closeMore);
  document.getElementById('bottom-more').addEventListener('click', openMore);
  document.getElementById('btn-quiz-close').addEventListener('click', closeQuiz);
  searchInput.addEventListener('input', performSearch);
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay') && !e.target.classList.contains('quiz-overlay')) {
      closeSearch(); closeMore();
    }
  });
}

// ─── OPEN CHAPTER ───
function openChapter(idx) {
  currentChapter = idx;
  const data = getData();
  const ch = data.chapters[idx];

  welcome.style.display = 'none';
  chapterContent.style.display = 'block';
  chapterContent.style.animation = 'none';
  setTimeout(() => chapterContent.style.animation = 'chapterSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)', 10);

  chapterHeader.innerHTML = `
    <h2><span class="ch-emoji">${ch.emoji}</span> ${ch.title}</h2>
    <div class="ch-count">${ch.facts.length} ${t('facts_')}</div>
  `;

  factsContainer.innerHTML = '';
  ch.facts.forEach((f, i) => {
    const card = renderFact(f, i);
    factsContainer.appendChild(card);
  });

  quizContainer.innerHTML = `
    <h3>${t('quizTitle')}</h3>
    <p style="color:var(--text2);font-size:13px;margin-bottom:10px;">${t('quizDesc')}</p>
    <button class="quiz-trigger-btn" onclick="playSound('chapterSwitch'); startQuiz(${idx})">${t('startQuiz')}</button>
  `;

  document.querySelectorAll('#chapter-list li').forEach((li, i) => li.classList.toggle('active', i === idx));
  document.querySelectorAll('#bottom-nav-list li').forEach((li, i) => li.classList.toggle('active', i === idx));

  updateReadingProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── RENDER FACT ───
function renderFact(f, index) {
  const isBookmarked = bookmarks.includes(f.id);
  const isExpanded = expandedFacts[f.id];
  const card = document.createElement('div');
  card.className = `fact-card${isExpanded ? ' expanded' : ''}`;
  card.dataset.factId = f.id;
  card.style.animationDelay = `${index * 0.05}s`;

  card.innerHTML = `
    <div class="fact-card-inner">
      <div class="fact-title">
        🔥 ${f.title}
        <button class="fav-btn${isBookmarked ? ' bookmarked' : ''}" data-id="${f.id}">❤️</button>
      </div>
      <div class="fact-stat">${f.stat}</div>
      <div class="fact-preview">${f.preview}</div>
      <button class="fact-expand-btn">
        ${isExpanded ? `🔼 ${t('showLess')}` : `🔽 ${t('readMore')}`}
      </button>
      <div class="fact-full">
        <div class="fact-explanation">${f.explanation}</div>
        <div class="weird-box">
          <div class="weird-box-label">${t('weirdLabel')}</div>
          <p>${f.weirdPart}</p>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  card.querySelector('.fact-expand-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('expand');
    toggleFact(f.id);
  });
  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('bookmark');
    toggleBookmark(f.id);
  });
  card.addEventListener('click', () => {
    if (!card.classList.contains('expanded')) {
      playSound('expand');
      toggleFact(f.id);
    }
  });

  return card;
}

function toggleFact(id) {
  expandedFacts[id] = !expandedFacts[id];
  localStorage.setItem('hmExpanded', JSON.stringify(expandedFacts));
  updateReadingProgress();
  if (currentChapter !== null) {
    const data = getData();
    const ch = data.chapters[currentChapter];
    factsContainer.innerHTML = '';
    ch.facts.forEach((f, i) => factsContainer.appendChild(renderFact(f, i)));
  }
}

function toggleBookmark(id) {
  const idx = bookmarks.indexOf(id);
  if (idx > -1) { bookmarks.splice(idx, 1); showToast(t('removed')); }
  else { bookmarks.push(id); showToast(t('bookmarked')); }
  localStorage.setItem('hmBookmarks', JSON.stringify(bookmarks));
  if (currentChapter !== null) {
    const data = getData();
    const ch = data.chapters[currentChapter];
    factsContainer.innerHTML = '';
    ch.facts.forEach((f, i) => factsContainer.appendChild(renderFact(f, i)));
  }
}

// ─── READING PROGRESS ───
function updateReadingProgress() {
  let total = 0, done = 0;
  getData().chapters.forEach(ch => ch.facts.forEach(f => { total++; if (expandedFacts[f.id]) done++; }));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = pct + '%';
}

// ─── RANDOM FACT ───
function randomFact() {
  const data = getData();
  const all = [];
  data.chapters.forEach((ch, ci) => ch.facts.forEach(f => all.push({ fact: f, chapter: ci })));
  const pick = all[Math.floor(Math.random() * all.length)];
  openChapter(pick.chapter);
  setTimeout(() => {
    const el = document.querySelector(`[data-fact-id="${pick.fact.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 35px rgba(0,255,136,0.3)';
      el.style.borderColor = 'var(--green)';
      setTimeout(() => { el.style.boxShadow = ''; el.style.borderColor = ''; }, 2000);
    }
  }, 400);
}

// ─── SEARCH ───
function openSearch() {
  searchOverlay.style.display = 'flex';
  searchInput.value = '';
  searchResults.innerHTML = `<p style="color:var(--text2);font-size:14px;">${t('searchType')}</p>`;
  setTimeout(() => searchInput.focus(), 200);
}
function closeSearch() { searchOverlay.style.display = 'none'; }

function performSearch() {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { searchResults.innerHTML = `<p style="color:var(--text2);font-size:14px;">${t('searchType')}</p>`; return; }
  const data = getData();
  const results = [];
  data.chapters.forEach((ch, ci) => {
    ch.facts.forEach(f => {
      if (f.title.toLowerCase().includes(q) || f.explanation.toLowerCase().includes(q) || f.weirdPart.toLowerCase().includes(q) || (f.stat||'').toLowerCase().includes(q))
        results.push({ fact: f, chapter: ch, ci });
    });
  });
  if (!results.length) { searchResults.innerHTML = `<p style="color:var(--text2);">${t('noResults')}</p>`; return; }
  searchResults.innerHTML = results.map(r => {
    const snippet = (r.fact.explanation.substring(0, 120) + '...').replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'), m => `<span class="highlight">${m}</span>`);
    return `<div class="search-result-item" onclick="playSound('chapterSwitch'); openChapter(${r.ci}); closeSearch();"><h4>${r.fact.title}</h4><p>${snippet}</p><div class="sr-chapter">${r.chapter.emoji} ${r.chapter.title}</div></div>`;
  }).join('');
}

// ─── QUIZ ───
function startQuiz(chapterIdx) {
  currentQuiz = chapterIdx; currentQuestionIdx = 0;
  showQuestion(); quizModal.style.display = 'flex';
}

function showQuestion() {
  const data = getData();
  const ch = data.chapters[currentQuiz];
  const q = ch.quiz[currentQuestionIdx];
  quizHeader.innerHTML = `<h2>📝 ${ch.emoji} ${ch.title} (${currentQuestionIdx+1}/3)</h2>`;
  quizQuestion.textContent = q.q;
  quizOptions.innerHTML = '';
  quizFeedback.style.display = 'none';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = `${String.fromCharCode(65+i)}) ${opt}`;
    btn.addEventListener('click', () => checkQuizAnswer(i));
    quizOptions.appendChild(btn);
  });
}

function checkQuizAnswer(selected) {
  const data = getData();
  const ch = data.chapters[currentQuiz];
  const q = ch.quiz[currentQuestionIdx];
  const options = quizOptions.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    opt.style.pointerEvents = 'none';
    if (i === q.ans) opt.classList.add('correct');
    else if (i === selected) opt.classList.add('wrong');
    else opt.classList.add('dimmed');
  });
  quizFeedback.style.display = 'block';
  if (selected === q.ans) {
    quizFeedback.className = 'correct';
    quizFeedback.textContent = `${t('correct')} ${q.exp}`;
    playSound('quizCorrect');
  } else {
    quizFeedback.className = 'wrong';
    const cl = String.fromCharCode(65 + q.ans);
    quizFeedback.textContent = `${t('incorrect')} ${cl}) ${q.opts[q.ans]}. ${q.exp}`;
    playSound('quizWrong');
  }
  setTimeout(() => {
    if (currentQuestionIdx < 2) { currentQuestionIdx++; showQuestion(); }
    else {
      playSound('quizComplete');
      spawnConfetti();
      quizHeader.innerHTML = `<h2>${t('quizComplete')}</h2>`;
      quizQuestion.textContent = currentLang === 'en' ? `You finished the ${ch.title} quiz!` : `Вы прошли тест "${ch.title}"!`;
      quizOptions.innerHTML = '';
      quizFeedback.style.display = 'none';
    }
  }, 3000);
}

function closeQuiz() { quizModal.style.display = 'none'; }

// ─── MORE MODAL ───
function openMore() {
  document.querySelector('#more-modal .overlay-header h2').textContent = t('allChapters');
  moreModal.style.display = 'flex';
}
function closeMore() { moreModal.style.display = 'none'; }

// ─── CONFETTI ───
function spawnConfetti() {
  const colors = ['#00ff88', '#e74c3c', '#ffd700', '#00bfff', '#ff69b4', '#7b68ee'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (4 + Math.random() * 6) + 'px';
    el.style.height = (4 + Math.random() * 6) + 'px';
    el.style.animationDuration = (1 + Math.random()) + 's';
    el.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ─── TOAST ───
function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ─── SERVICE WORKER ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ─── BOOT ───
document.addEventListener('DOMContentLoaded', init);