// app.js — логика приложения «Бюджет».
// Шаг 6: блок «Цели» — добавление, редактирование, важность, прогресс, прогноз.

// =====================================================
//  СЧЕТА (блок «Кошелёк»)
// =====================================================

const ACCOUNTS_KEY = "budget_app_accounts";

// Счета по умолчанию (показываются при самом первом запуске)
const DEFAULT_ACCOUNTS = [
  { id: 1, name: "Т-Банк", balance: 100000 },
  { id: 2, name: "Сбер", balance: 1200 },
  { id: 3, name: "Наличные", balance: 58300 },
];

function loadAccounts() {
  const saved = localStorage.getItem(ACCOUNTS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_ACCOUNTS;
}

function saveAccounts() {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

let accounts = loadAccounts();

// =====================================================
//  КАТЕГОРИИ (блок «Бюджет на месяц»)
// =====================================================

const CATEGORIES_KEY = "budget_app_categories";

// Категории по умолчанию (показываются при самом первом запуске).
// planned — целевая сумма расходов на месяц, spent — уже потрачено.
const DEFAULT_CATEGORIES = [
  { id: 1, name: "Продукты", planned: 89500, spent: 0 },
  { id: 2, name: "Развлечения", planned: 10000, spent: 0 },
  { id: 3, name: "Хозяйство", planned: 30000, spent: 0 },
  { id: 4, name: "Спорт", planned: 40000, spent: 0 },
  { id: 5, name: "Непредвиденные", planned: 15000, spent: 0 },
];

function loadCategories() {
  const saved = localStorage.getItem(CATEGORIES_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_CATEGORIES;
}

function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

let categories = loadCategories();

// =====================================================
//  СБЕРЕЖЕНИЯ (желаемая сумма, которую хочется отложить)
// =====================================================

const SAVINGS_KEY = "budget_app_savings";
const DEFAULT_SAVINGS = 70000;

function loadSavings() {
  const saved = localStorage.getItem(SAVINGS_KEY);
  if (saved !== null) {
    return Number(saved);
  }
  return DEFAULT_SAVINGS;
}

function saveSavings() {
  localStorage.setItem(SAVINGS_KEY, String(savings));
}

let savings = loadSavings();

// =====================================================
//  РАСХОДЫ (история операций)
// =====================================================

const EXPENSES_KEY = "budget_app_expenses";

function loadExpenses() {
  const saved = localStorage.getItem(EXPENSES_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return [];
}

function saveExpenses() {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

let expenses = loadExpenses();

// =====================================================
//  ЦЕЛИ (накопления). Порядок в массиве = важность: первая важнее всех.
// =====================================================

const GOALS_KEY = "budget_app_goals";

const DEFAULT_GOALS = [
  { id: 1, name: "Др на берегу",       target: 30000,   accumulated: 5000 },
  { id: 2, name: "Поездка в Тайланд",  target: 150000,  accumulated: 9000 },
  { id: 3, name: "Новое фортепиано",   target: 80000,   accumulated: 6000 },
  { id: 4, name: "Машина",             target: 1500000, accumulated: 10000 },
  { id: 5, name: "Операция на нёсик",  target: 200000,  accumulated: 0 },
];

function loadGoals() {
  const saved = localStorage.getItem(GOALS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_GOALS;
}

function saveGoals() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

let goals = loadGoals();

// =====================================================
//  ВСПОМОГАТЕЛЬНОЕ
// =====================================================

// Красивый формат числа: 100000 -> "100 000"
function formatMoney(n) {
  return n.toLocaleString("ru-RU");
}

// =====================================================
//  ПРОВЕРКА РАВЕНСТВА: категории + сбережения ≤ Кошелёк
// =====================================================

function updateWarning() {
  const wallet = accounts.reduce((s, a) => s + a.balance, 0);
  const plansSum = categories.reduce((s, c) => s + c.planned, 0);
  const need = plansSum + savings;

  const card = document.getElementById("warningCard");
  const text = document.getElementById("warningText");

  if (need > wallet) {
    const overflow = need - wallet;
    text.textContent =
      "Категории (" + formatMoney(plansSum) +
      ") и сбережения (" + formatMoney(savings) +
      ") превышают Кошелёк (" + formatMoney(wallet) +
      ") на " + formatMoney(overflow) +
      ". Снизьте сбережения или урежьте план по категориям.";
    card.hidden = false;
  } else {
    card.hidden = true;
  }
}

// =====================================================
//  ОТРИСОВКА: блок «Кошелёк»
// =====================================================

function renderWallet() {
  const list = document.getElementById("accountsList");
  list.innerHTML = "";

  let total = 0;
  for (const acc of accounts) {
    total += acc.balance;

    const li = document.createElement("li");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = acc.name;

    const value = document.createElement("span");
    value.className = "value";
    value.textContent = formatMoney(acc.balance);

    const del = document.createElement("button");
    del.className = "btn-del";
    del.textContent = "×";
    del.title = "Удалить счёт";
    del.addEventListener("click", () => removeAccount(acc.id));

    li.append(name, value, del);
    list.append(li);
  }

  // «Кошелёк» = сумма всех счетов
  document.getElementById("walletTotal").textContent = formatMoney(total);

  updateWarning();
  refreshExpenseFormIfReady();
}

function addAccount() {
  const nameInput = document.getElementById("newAccountName");
  const balanceInput = document.getElementById("newAccountBalance");

  const name = nameInput.value.trim();
  const balance = Number(balanceInput.value);

  if (name === "") {
    alert("Введите название счёта");
    return;
  }

  accounts.push({ id: Date.now(), name: name, balance: balance || 0 });
  saveAccounts();
  renderWallet();

  nameInput.value = "";
  balanceInput.value = "";
}

function removeAccount(id) {
  accounts = accounts.filter((acc) => acc.id !== id);
  saveAccounts();
  renderWallet();
}

// =====================================================
//  ОТРИСОВКА: блок «Бюджет на месяц»
// =====================================================

function renderBudget() {
  const list = document.getElementById("categoriesList");
  list.innerHTML = "";

  for (const cat of categories) {
    const li = document.createElement("li");

    // Поле «название категории» — редактируется прямо в строке
    const name = document.createElement("input");
    name.type = "text";
    name.className = "name";
    name.value = cat.name;
    name.addEventListener("change", () => {
      cat.name = name.value.trim();
      saveCategories();
    });

    // Сколько уже потрачено в этой категории
    const spent = document.createElement("span");
    spent.className = "spent-label";
    spent.textContent = "потрачено " + formatMoney(cat.spent);

    // Поле «план» — целевая сумма расходов на месяц
    const planned = document.createElement("input");
    planned.type = "number";
    planned.className = "value";
    planned.value = cat.planned;
    planned.addEventListener("change", () => {
      cat.planned = Number(planned.value) || 0;
      saveCategories();
      updateWarning();
    });

    const del = document.createElement("button");
    del.className = "btn-del";
    del.textContent = "×";
    del.title = "Удалить категорию";
    del.addEventListener("click", () => removeCategory(cat.id));

    li.append(name, spent, planned, del);
    list.append(li);
  }

  updateWarning();
  refreshExpenseFormIfReady();
}

function addCategory() {
  const nameInput = document.getElementById("newCategoryName");
  const plannedInput = document.getElementById("newCategoryPlanned");

  const name = nameInput.value.trim();
  const planned = Number(plannedInput.value);

  if (name === "") {
    alert("Введите название категории");
    return;
  }

  categories.push({
    id: Date.now(),
    name: name,
    planned: planned || 0,
    spent: 0,
  });
  saveCategories();
  renderBudget();

  nameInput.value = "";
  plannedInput.value = "";
}

function removeCategory(id) {
  categories = categories.filter((cat) => cat.id !== id);
  saveCategories();
  renderBudget();
}

// =====================================================
//  ОТРИСОВКА: блок «Цели»
// =====================================================

// Прогноз даты достижения цели #index.
// Все сбережения идут сначала в самую важную цель (i=0), затем в следующую и т.д.
// Поэтому для цели #N нужно сначала «закрыть» все предыдущие.
function forecastDate(index) {
  const g = goals[index];
  if (g.accumulated >= g.target) return "достигнута";
  if (savings <= 0) return "—";

  let totalMonths = 0;
  for (let i = 0; i <= index; i++) {
    const gi = goals[i];
    const need = Math.max(0, gi.target - gi.accumulated);
    totalMonths += need / savings;
  }
  const months = Math.ceil(totalMonths);

  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function renderGoals() {
  const list = document.getElementById("goalsList");
  list.innerHTML = "";

  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    const li = document.createElement("li");

    // --- Строка 1: название + стрелки важности + удаление ---
    const row1 = document.createElement("div");
    row1.className = "goal-row";

    const name = document.createElement("input");
    name.type = "text";
    name.className = "name";
    name.value = g.name;
    name.addEventListener("change", () => {
      g.name = name.value.trim();
      saveGoals();
    });

    const up = document.createElement("button");
    up.className = "btn-arrow";
    up.textContent = "↑";
    up.title = "Поднять важность";
    up.disabled = (i === 0);
    up.addEventListener("click", () => moveGoal(i, -1));

    const down = document.createElement("button");
    down.className = "btn-arrow";
    down.textContent = "↓";
    down.title = "Понизить важность";
    down.disabled = (i === goals.length - 1);
    down.addEventListener("click", () => moveGoal(i, 1));

    const del = document.createElement("button");
    del.className = "btn-del";
    del.textContent = "×";
    del.title = "Удалить цель";
    del.addEventListener("click", () => removeGoal(g.id));

    row1.append(name, up, down, del);

    // --- Строка 2: накоплено / цель + прогноз ---
    const row2 = document.createElement("div");
    row2.className = "goal-row goal-numbers";

    const accLabel = document.createElement("span");
    accLabel.className = "muted";
    accLabel.textContent = "накоплено";

    const accInput = document.createElement("input");
    accInput.type = "number";
    accInput.className = "small-num";
    accInput.value = g.accumulated;
    accInput.addEventListener("change", () => {
      g.accumulated = Number(accInput.value) || 0;
      saveGoals();
      renderGoals();
    });

    const slash = document.createElement("span");
    slash.textContent = "/";

    const targetInput = document.createElement("input");
    targetInput.type = "number";
    targetInput.className = "small-num";
    targetInput.value = g.target;
    targetInput.addEventListener("change", () => {
      g.target = Number(targetInput.value) || 0;
      saveGoals();
      renderGoals();
    });

    const forecast = document.createElement("span");
    forecast.className = "forecast";
    forecast.textContent = "прогноз: " + forecastDate(i);

    row2.append(accLabel, accInput, slash, targetInput, forecast);

    // --- Строка 3: прогресс-бар ---
    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    const pct = g.target > 0
      ? Math.min(100, (g.accumulated / g.target) * 100)
      : 0;
    bar.style.width = pct + "%";
    progress.append(bar);

    li.append(row1, row2, progress);
    list.append(li);
  }
}

function addGoal() {
  const nameInput = document.getElementById("newGoalName");
  const targetInput = document.getElementById("newGoalTarget");

  const name = nameInput.value.trim();
  const target = Number(targetInput.value);

  if (name === "") {
    alert("Введите название цели");
    return;
  }

  goals.push({
    id: Date.now(),
    name: name,
    target: target || 0,
    accumulated: 0,
  });
  saveGoals();
  renderGoals();

  nameInput.value = "";
  targetInput.value = "";
}

function removeGoal(id) {
  goals = goals.filter((g) => g.id !== id);
  saveGoals();
  renderGoals();
}

// Сдвинуть цель на одну позицию (dir = -1 вверх, +1 вниз)
function moveGoal(index, dir) {
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= goals.length) return;
  [goals[index], goals[newIndex]] = [goals[newIndex], goals[index]];
  saveGoals();
  renderGoals();
}

// =====================================================
//  ОТРИСОВКА: блок «Сбережения»
// =====================================================

function renderSavings() {
  document.getElementById("savingsValue").value = savings;
}

// =====================================================
//  ОТРИСОВКА: форма ввода расхода
// =====================================================

// Безопасный вызов из renderWallet/renderBudget на старте,
// когда форма расхода ещё может быть не нужна.
function refreshExpenseFormIfReady() {
  if (document.getElementById("expenseCategory")) {
    renderExpenseForm();
  }
}

// Перезаполняет списки категорий и счетов в форме расхода.
// Вызывается при любом изменении категорий или счетов.
function renderExpenseForm() {
  const catSelect = document.getElementById("expenseCategory");
  const accSelect = document.getElementById("expenseAccount");

  const prevCat = catSelect.value;
  const prevAcc = accSelect.value;

  catSelect.innerHTML = "";
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    catSelect.append(opt);
  }
  if (prevCat) catSelect.value = prevCat;

  accSelect.innerHTML = "";
  for (const acc of accounts) {
    const opt = document.createElement("option");
    opt.value = acc.id;
    opt.textContent = acc.name;
    accSelect.append(opt);
  }
  if (prevAcc) accSelect.value = prevAcc;
}

// =====================================================
//  ДЕЙСТВИЕ: добавить расход
// =====================================================

function addExpense() {
  const amountInput = document.getElementById("expenseAmount");
  const catSelect = document.getElementById("expenseCategory");
  const accSelect = document.getElementById("expenseAccount");

  const amount = Number(amountInput.value);
  if (!amount || amount <= 0) {
    alert("Введите сумму расхода");
    return;
  }

  const catId = Number(catSelect.value);
  const accId = Number(accSelect.value);

  const cat = categories.find((c) => c.id === catId);
  const acc = accounts.find((a) => a.id === accId);
  if (!cat || !acc) {
    alert("Выберите категорию и счёт");
    return;
  }

  // Уменьшаем баланс счёта и увеличиваем «потрачено» в категории
  acc.balance -= amount;
  cat.spent += amount;

  expenses.push({
    id: Date.now(),
    amount: amount,
    categoryId: catId,
    accountId: accId,
    date: new Date().toISOString(),
  });

  saveAccounts();
  saveCategories();
  saveExpenses();

  amountInput.value = "";

  renderWallet();
  renderBudget();
}

// =====================================================
//  ЗАПУСК
// =====================================================

document.getElementById("addAccountBtn").addEventListener("click", addAccount);
document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
document.getElementById("addExpenseBtn").addEventListener("click", addExpense);
document.getElementById("addGoalBtn").addEventListener("click", addGoal);

document.getElementById("savingsValue").addEventListener("change", (e) => {
  savings = Number(e.target.value) || 0;
  saveSavings();
  updateWarning();
  renderGoals();  // прогноз зависит от величины сбережений
});

renderWallet();
renderBudget();
renderSavings();
renderExpenseForm();
renderGoals();
