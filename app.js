/* ===========================================
   BUDGET TRACKER — app.js
   =========================================== */

/* -------------------------------------------
   STORAGE KEYS
------------------------------------------- */
const KEYS = {
  transactions:   'budgetapp_v1',
  budget:         'budgetapp_budget',
  theme:          'budgetapp_theme',
  customExpense:  'budgetapp_custom_expense',
  customIncome:   'budgetapp_custom_income',
};

/* -------------------------------------------
   PERSISTENCE HELPERS
------------------------------------------- */
function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* -------------------------------------------
   BUILT-IN CATEGORIES
------------------------------------------- */
const BASE_EXPENSE_CATS = [
  { name: 'Food & Drink',  emoji: '🍔', color: '#f97316', custom: false },
  { name: 'Transport',     emoji: '🚗', color: '#3b82f6', custom: false },
  { name: 'Shopping',      emoji: '🛍️', color: '#a855f7', custom: false },
  { name: 'Health',        emoji: '💊', color: '#ef4444', custom: false },
  { name: 'Entertainment', emoji: '🎬', color: '#ec4899', custom: false },
  { name: 'Utilities',     emoji: '💡', color: '#eab308', custom: false },
  { name: 'Housing',       emoji: '🏠', color: '#14b8a6', custom: false },
  { name: 'Education',     emoji: '📚', color: '#6366f1', custom: false },
  { name: 'Other',         emoji: '📦', color: '#94a3b8', custom: false },
];

const BASE_INCOME_CATS = [
  { name: 'Salary',       emoji: '💼', color: '#22c55e', custom: false },
  { name: 'Freelance',    emoji: '💻', color: '#10b981', custom: false },
  { name: 'Investment',   emoji: '📈', color: '#06b6d4', custom: false },
  { name: 'Gift',         emoji: '🎁', color: '#f472b6', custom: false },
  { name: 'Other Income', emoji: '💰', color: '#84cc16', custom: false },
];

/* palette cycled for auto-coloring new custom cats */
const CUSTOM_COLORS = [
  '#f97316','#3b82f6','#a855f7','#ef4444','#ec4899',
  '#eab308','#14b8a6','#6366f1','#06b6d4','#84cc16',
];

/* -------------------------------------------
   DYNAMIC CATEGORY LISTS
   (base + custom, loaded from localStorage)
------------------------------------------- */
let expenseCats = [];
let incomeCats  = [];

function loadCategories() {
  const customExp = storageGet(KEYS.customExpense, []);
  const customInc = storageGet(KEYS.customIncome, []);
  expenseCats = [...BASE_EXPENSE_CATS, ...customExp];
  incomeCats  = [...BASE_INCOME_CATS,  ...customInc];
}

function saveCustomCategories() {
  storageSet(KEYS.customExpense, expenseCats.filter(c => c.custom));
  storageSet(KEYS.customIncome,  incomeCats.filter(c => c.custom));
}

function getCat(name) {
  return [...expenseCats, ...incomeCats].find(c => c.name === name)
      || { name, emoji: '📦', color: '#94a3b8' };
}

function addCustomCategory(type, name, emoji) {
  const list  = type === 'expense' ? expenseCats : incomeCats;
  if (list.find(c => c.name.toLowerCase() === name.toLowerCase())) return false;
  const idx   = list.filter(c => c.custom).length;
  const color = CUSTOM_COLORS[idx % CUSTOM_COLORS.length];
  list.push({ name, emoji, color, custom: true });
  saveCustomCategories();
  return true;
}

function removeCustomCategory(type, name) {
  if (type === 'expense') {
    expenseCats = expenseCats.filter(c => !(c.name === name && c.custom));
  } else {
    incomeCats = incomeCats.filter(c => !(c.name === name && c.custom));
  }
  saveCustomCategories();
}

/* -------------------------------------------
   TRANSACTIONS
------------------------------------------- */
let transactions = [];

function loadTransactions()  { transactions = storageGet(KEYS.transactions, []); }
function saveTransactions()  { storageSet(KEYS.transactions, transactions); }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* -------------------------------------------
   SEED DATA  (only on first visit)
------------------------------------------- */
function seedData() {
  if (transactions.length > 0) return;

  const today = new Date();
  const daysAgo = offset => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d.toISOString().split('T')[0];
  };

  transactions = [
    { id: uid(), type: 'income',  desc: 'Monthly Salary',   amount: 3500,  category: 'Salary',        date: daysAgo(20) },
    { id: uid(), type: 'expense', desc: 'Rent Payment',      amount: 950,   category: 'Housing',       date: daysAgo(19) },
    { id: uid(), type: 'expense', desc: 'Grocery Run',       amount: 84.50, category: 'Food & Drink',  date: daysAgo(15) },
    { id: uid(), type: 'expense', desc: 'Netflix',           amount: 15.99, category: 'Entertainment', date: daysAgo(14) },
    { id: uid(), type: 'expense', desc: 'Uber Ride',         amount: 22,    category: 'Transport',     date: daysAgo(12) },
    { id: uid(), type: 'income',  desc: 'Freelance Project', amount: 450,   category: 'Freelance',     date: daysAgo(10) },
    { id: uid(), type: 'expense', desc: 'Electricity Bill',  amount: 67,    category: 'Utilities',     date: daysAgo(9)  },
    { id: uid(), type: 'expense', desc: 'Coffee Shop',       amount: 12.50, category: 'Food & Drink',  date: daysAgo(7)  },
    { id: uid(), type: 'expense', desc: 'New Sneakers',      amount: 110,   category: 'Shopping',      date: daysAgo(5)  },
    { id: uid(), type: 'expense', desc: 'Gym Membership',    amount: 40,    category: 'Health',        date: daysAgo(3)  },
    { id: uid(), type: 'expense', desc: 'Online Course',     amount: 29,    category: 'Education',     date: daysAgo(2)  },
    { id: uid(), type: 'expense', desc: 'Takeout Dinner',    amount: 35,    category: 'Food & Drink',  date: daysAgo(1)  },
  ];

  saveTransactions();
  storageSet(KEYS.budget, 2000);
}

/* -------------------------------------------
   APP STATE
------------------------------------------- */
let currentType         = 'expense';
let currentFilter       = 'all';
let summaryYear         = new Date().getFullYear();
let summaryMonth        = new Date().getMonth();   // 0-indexed
let modalCategoryType   = 'expense';
let selectedEmoji       = '📦';

/* -------------------------------------------
   FORMATTING HELPERS
------------------------------------------- */
function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* -------------------------------------------
   TOAST
------------------------------------------- */
let toastTimer;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* -------------------------------------------
   THEME (dark / light)
------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem(KEYS.theme) || 'light';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  if (save) localStorage.setItem(KEYS.theme, theme);
  // re-draw chart so colours use updated CSS vars
  renderChart();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* -------------------------------------------
   TRANSACTION FORM — type toggle
------------------------------------------- */
function setType(type) {
  currentType = type;
  document.getElementById('btn-expense').className =
    'type-btn' + (type === 'expense' ? ' active-expense' : '');
  document.getElementById('btn-income').className =
    'type-btn' + (type === 'income' ? ' active-income' : '');
  populateCategoryDropdown();
}

function populateCategoryDropdown() {
  const sel  = document.getElementById('tx-category');
  const cats = currentType === 'expense' ? expenseCats : incomeCats;
  sel.innerHTML = cats
    .map(c => `<option value="${escHtml(c.name)}">${c.emoji} ${escHtml(c.name)}</option>`)
    .join('');
}

/* -------------------------------------------
   ADD TRANSACTION
------------------------------------------- */
function addTransaction() {
  const desc   = document.getElementById('tx-desc').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const cat    = document.getElementById('tx-category').value;
  const date   = document.getElementById('tx-date').value;

  if (!desc)              { showToast('⚠️ Please enter a description'); return; }
  if (!amount || amount <= 0) { showToast('⚠️ Enter a valid amount');  return; }
  if (!date)              { showToast('⚠️ Please pick a date');        return; }

  transactions.unshift({ id: uid(), type: currentType, desc, amount, category: cat, date });
  saveTransactions();

  document.getElementById('tx-desc').value   = '';
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-date').value   = todayISO();

  render();
  showToast(currentType === 'income' ? '✅ Income added!' : '✅ Expense added!');
}

/* -------------------------------------------
   DELETE TRANSACTION
------------------------------------------- */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
  showToast('🗑️ Transaction removed');
}

/* -------------------------------------------
   TRANSACTION FILTER
------------------------------------------- */
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTransactions();
}

/* -------------------------------------------
   BUDGET
------------------------------------------- */
function saveBudget() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (!val || val <= 0) { showToast('⚠️ Enter a valid budget amount'); return; }
  storageSet(KEYS.budget, val);
  document.getElementById('budget-input').value = '';
  renderBudget();
  showToast('✅ Budget saved!');
}

/* -------------------------------------------
   MONTHLY SUMMARY — navigation
------------------------------------------- */
function prevMonth() {
  summaryMonth--;
  if (summaryMonth < 0) { summaryMonth = 11; summaryYear--; }
  renderMonthlySummary();
}

function nextMonth() {
  summaryMonth++;
  if (summaryMonth > 11) { summaryMonth = 0; summaryYear++; }
  renderMonthlySummary();
}

/* -------------------------------------------
   CUSTOM CATEGORIES MODAL
------------------------------------------- */
const EMOJI_OPTIONS = [
  '🍔','🚗','🛍️','💊','🎬','💡','🏠','📚','📦','💼','💻','📈','🎁','💰',
  '✈️','🎮','🏋️','🍕','☕','🛒','💈','🏥','🎓','🐾','🎸','🏖️','🧴','🍷',
];

function openCategoryModal(type) {
  modalCategoryType = type;
  selectedEmoji = '📦';

  document.getElementById('modal-cat-type-label').textContent =
    type === 'expense' ? 'Expense' : 'Income';
  document.getElementById('new-cat-name').value = '';

  renderEmojiPicker();
  renderCategoryChips();

  document.getElementById('cat-modal').classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('cat-modal').classList.remove('open');
}

function renderEmojiPicker() {
  const container = document.getElementById('emoji-picker');
  container.innerHTML = EMOJI_OPTIONS.map(e => `
    <span
      class="emoji-opt${e === selectedEmoji ? ' selected' : ''}"
      onclick="selectEmoji('${e}')"
      role="button"
      aria-label="Select ${e}"
    >${e}</span>
  `).join('');
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  renderEmojiPicker();
}

function addCustomCategoryFromModal() {
  const nameInput = document.getElementById('new-cat-name');
  const name = nameInput.value.trim();

  if (!name)       { showToast('⚠️ Enter a category name'); return; }
  if (name.length > 30) { showToast('⚠️ Name too long (30 chars max)'); return; }

  const ok = addCustomCategory(modalCategoryType, name, selectedEmoji);
  if (!ok) { showToast('⚠️ Category already exists'); return; }

  nameInput.value = '';
  selectedEmoji = '📦';
  renderEmojiPicker();
  renderCategoryChips();
  populateCategoryDropdown();
  showToast(`✅ "${name}" category added`);
}

function deleteCustomCategoryFromModal(name) {
  removeCustomCategory(modalCategoryType, name);
  renderCategoryChips();
  populateCategoryDropdown();
  showToast('🗑️ Category removed');
}

function renderCategoryChips() {
  const list = modalCategoryType === 'expense' ? expenseCats : incomeCats;
  const container = document.getElementById('cat-chips');

  container.innerHTML = list.map(c => {
    const delBtn = c.custom
      ? `<button class="cat-chip-del" onclick="deleteCustomCategoryFromModal('${escHtml(c.name)}')" title="Remove">✕</button>`
      : '';
    return `
      <span class="cat-chip">
        ${c.emoji} ${escHtml(c.name)}${delBtn}
      </span>`;
  }).join('');
}

/* -------------------------------------------
   RENDER — Balance Summary
------------------------------------------- */
function renderSummary() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const balEl = document.getElementById('balance');
  balEl.className = 'balance-amount ' +
    (balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral');

  const sign = balance > 0 ? '+' : balance < 0 ? '-' : '';
  balEl.textContent = sign + fmt(balance);

  document.getElementById('total-income').textContent  = fmt(income);
  document.getElementById('total-expense').textContent = fmt(expense);
}

/* -------------------------------------------
   RENDER — Budget Progress
------------------------------------------- */
function renderBudget() {
  const budget = storageGet(KEYS.budget, 0);
  const now    = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthSpent = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(prefix))
    .reduce((s, t) => s + t.amount, 0);

  const bar   = document.getElementById('budget-bar');
  const label = document.getElementById('budget-spent-label');

  if (!budget) {
    label.textContent = 'No budget set';
    bar.style.width = '0%';
    bar.className = 'progress-fill';
    return;
  }

  const pct = Math.min((monthSpent / budget) * 100, 100);
  bar.style.width = pct + '%';
  bar.className   = 'progress-fill' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warn' : '');
  label.textContent = `${fmt(monthSpent)} / ${fmt(budget)}`;
}

/* -------------------------------------------
   RENDER — Monthly Summary
------------------------------------------- */
function renderMonthlySummary() {
  const prefix = `${summaryYear}-${String(summaryMonth + 1).padStart(2, '0')}`;
  const monthTxns = transactions.filter(t => t.date.startsWith(prefix));

  const income  = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net     = income - expense;

  // header label
  document.getElementById('summary-month-label').textContent = monthLabel(summaryYear, summaryMonth);

  // stats
  document.getElementById('summary-income').textContent  = fmt(income);
  document.getElementById('summary-expense').textContent = fmt(expense);

  const netEl = document.getElementById('summary-net');
  netEl.textContent = (net >= 0 ? '+' : '-') + fmt(net);
  netEl.className   = 's-val net ' + (net >= 0 ? 'positive' : 'negative');

  // top spending categories
  const totals = {};
  monthTxns.filter(t => t.type === 'expense').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const top = Object.entries(totals)
    .map(([name, val]) => ({ name, val, cat: getCat(name) }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  const topContainer = document.getElementById('top-spending');
  if (!top.length) {
    topContainer.innerHTML =
      `<p style="font-size:.85rem;color:var(--muted);text-align:center;padding:12px 0">No expenses this month</p>`;
    return;
  }

  const maxVal = top[0].val;
  topContainer.innerHTML = top.map(({ name, val, cat }) => {
    const pct = Math.round((val / maxVal) * 100);
    return `
      <div class="top-item">
        <div class="top-item-icon">${cat.emoji}</div>
        <div class="top-item-body">
          <div class="top-item-name">${escHtml(name)}</div>
          <div class="top-item-bar" style="width:${pct}%;background:${cat.color}"></div>
        </div>
        <div class="top-item-amount">${fmt(val)}</div>
      </div>`;
  }).join('');
}

/* -------------------------------------------
   RENDER — Transaction List
------------------------------------------- */
function renderTransactions() {
  const list = document.getElementById('tx-list');
  const filtered = currentFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === currentFilter);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">🧾</div>
        <p>No transactions yet.<br>Add one above to get started.</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => {
    const cat  = getCat(t.category);
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="tx-item">
        <div class="tx-icon" style="background:${cat.color}22">${cat.emoji}</div>
        <div class="tx-body">
          <div class="tx-desc">${escHtml(t.desc)}</div>
          <div class="tx-meta">${escHtml(t.category)} · ${fmtDate(t.date)}</div>
        </div>
        <div class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</div>
        <button class="tx-delete" onclick="deleteTransaction('${t.id}')" title="Delete">✕</button>
      </div>`;
  }).join('');
}

/* -------------------------------------------
   RENDER — Donut Chart  (pure Canvas)
------------------------------------------- */
function renderChart() {
  const canvas = document.getElementById('chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // aggregate expenses by category
  const totals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(totals)
    .map(([name, val]) => ({ name, val, ...getCat(name) }))
    .sort((a, b) => b.val - a.val);

  const total = entries.reduce((s, e) => s + e.val, 0);

  // HiDPI setup
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.offsetWidth || 320;
  const H   = 260;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // read CSS variable colours for text (respects dark mode)
  const style    = getComputedStyle(document.documentElement);
  const textCol  = style.getPropertyValue('--text').trim()   || '#1e293b';
  const mutedCol = style.getPropertyValue('--muted').trim()  || '#64748b';
  const holeCol  = style.getPropertyValue('--chart-hole').trim() || '#ffffff';
  const bodyFont = style.getPropertyValue('--font').trim()   || 'system-ui, sans-serif';

  if (!entries.length) {
    ctx.fillStyle = mutedCol;
    ctx.font = `14px ${bodyFont}`;
    ctx.textAlign = 'center';
    ctx.fillText('No expense data yet', W / 2, H / 2);
    return;
  }

  // donut geometry
  const cx = W / 2, cy = 118, r = 88, innerR = 52;
  let angle = -Math.PI / 2;

  entries.forEach(e => {
    const slice = (e.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = e.color;
    ctx.fill();
    angle += slice;
  });

  // inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = holeCol;
  ctx.fill();

  // center label
  ctx.textAlign = 'center';
  ctx.fillStyle = mutedCol;
  ctx.font      = `600 11px ${bodyFont}`;
  ctx.fillText('TOTAL SPENT', cx, cy - 10);
  ctx.fillStyle = textCol;
  ctx.font      = `700 18px ${bodyFont}`;
  ctx.fillText(fmt(total), cx, cy + 12);

  // legend (2-column grid below donut)
  const legendY = cy + r + 18;
  const cols    = 2;
  const colW    = W / cols;
  const lineH   = 22;

  ctx.textAlign = 'left';
  entries.slice(0, 8).forEach((e, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = col * colW + 14;
    const y   = legendY + row * lineH;

    ctx.beginPath();
    ctx.arc(x + 6, y + 1, 6, 0, 2 * Math.PI);
    ctx.fillStyle = e.color;
    ctx.fill();

    ctx.fillStyle = textCol;
    ctx.font      = `600 11px ${bodyFont}`;
    const label   = e.name.length > 12 ? e.name.slice(0, 11) + '…' : e.name;
    ctx.fillText(label, x + 16, y + 5);

    ctx.fillStyle = mutedCol;
    ctx.font      = `11px ${bodyFont}`;
    ctx.fillText(((e.val / total) * 100).toFixed(1) + '%', x + 16, y + 17);
  });

  // expand canvas height if legend overflows
  const rows   = Math.ceil(Math.min(entries.length, 8) / cols);
  const needed = legendY + rows * lineH + 10;
  if (needed > H) {
    canvas.height       = needed * dpr;
    canvas.style.height = needed + 'px';
    ctx.scale(dpr, dpr);
    renderChart();   // single recursive redraw with correct height
  }
}

/* -------------------------------------------
   MASTER RENDER
------------------------------------------- */
function render() {
  renderSummary();
  renderBudget();
  renderMonthlySummary();
  renderTransactions();
  renderChart();
}

/* -------------------------------------------
   UTILITIES
------------------------------------------- */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* -------------------------------------------
   INIT
------------------------------------------- */
(function init() {
  loadCategories();
  loadTransactions();
  seedData();
  loadTransactions(); // reload after potential seed write

  initTheme();

  document.getElementById('tx-date').value = todayISO();

  const savedBudget = storageGet(KEYS.budget, 0);
  if (savedBudget) {
    document.getElementById('budget-input').placeholder = `Current: ${fmt(savedBudget)}`;
  }

  populateCategoryDropdown();
  render();

  // close modal when clicking backdrop
  document.getElementById('cat-modal').addEventListener('click', function (e) {
    if (e.target === this) closeCategoryModal();
  });

  // re-draw chart on window resize
  window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(renderChart, 120);
  });
})();
