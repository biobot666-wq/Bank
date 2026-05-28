// app.js — логика приложения «Бюджет».
// Шаг 7: «Закрыть месяц» + покрытие перерасхода из целей через модальное окно.

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
  { id: 1, name: "Продукты",       planned: 89500, spent: 0, overflow_covered: 0 },
  { id: 2, name: "Развлечения",    planned: 10000, spent: 0, overflow_covered: 0 },
  { id: 3, name: "Хозяйство",      planned: 30000, spent: 0, overflow_covered: 0 },
  { id: 4, name: "Спорт",          planned: 40000, spent: 0, overflow_covered: 0 },
  { id: 5, name: "Непредвиденные", planned: 15000, spent: 0, overflow_covered: 0 },
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

// Миграция: гарантируем поле overflow_covered у всех категорий
for (const c of categories) {
  if (c.overflow_covered === undefined) c.overflow_covered = 0;
}

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

// Сколько перерасхода в категории ещё НЕ покрыто из целей
function unresolvedOverflow(cat) {
  const over = Math.max(0, cat.spent - cat.planned);
  return Math.max(0, over - (cat.overflow_covered || 0));
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

    // Если есть непокрытый перерасход — подсветка строки и кнопка «!»
    const unresolved = unresolvedOverflow(cat);
    if (unresolved > 0) {
      li.classList.add("overflow");
      const warn = document.createElement("button");
      warn.className = "btn-warn";
      warn.textContent = "!";
      warn.title =
        "Перерасход " + formatMoney(unresolved) +
        " ₽. Кликни, чтобы покрыть его из целей.";
      warn.addEventListener("click", () => {
        openOverflowModal(cat.id, unresolved, {
          onResolve: () => {
            saveCategories();
            saveGoals();
            renderBudget();
            renderGoals();
          },
          onCancel: () => {},
        });
      });
      li.append(name, spent, warn, planned, del);
    } else {
      li.append(name, spent, planned, del);
    }

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
    overflow_covered: 0,
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

  // Считаем, появится ли НОВЫЙ непокрытый перерасход после этого расхода
  const unresolvedBefore = unresolvedOverflow(cat);

  // Применяем расход (физически: счёт уменьшается, потрачено растёт)
  acc.balance -= amount;
  cat.spent += amount;

  const expenseRecord = {
    id: Date.now(),
    amount: amount,
    categoryId: catId,
    accountId: accId,
    date: new Date().toISOString(),
  };
  expenses.push(expenseRecord);

  const unresolvedAfter = unresolvedOverflow(cat);
  const newOverflow = unresolvedAfter - unresolvedBefore;

  // Функция сохранения и перерисовки всего, что могло измениться
  function commit() {
    saveAccounts();
    saveCategories();
    saveExpenses();
    saveGoals();
    amountInput.value = "";
    renderWallet();
    renderBudget();
    renderGoals();
  }

  if (newOverflow > 0) {
    // Расход создал новый перерасход — заставляем выбрать цель
    openOverflowModal(cat.id, newOverflow, {
      onResolve: () => {
        commit();
      },
      onCancel: () => {
        // Откатываем расход целиком
        acc.balance += amount;
        cat.spent -= amount;
        expenses.pop();
        // Не сохраняем — мы изначально не успели сохранить
        renderWallet();
        renderBudget();
      },
    });
  } else {
    commit();
  }
}

// =====================================================
//  МОДАЛЬНОЕ ОКНО: покрытие перерасхода из целей
// =====================================================

// Текущее состояние модалки. null, если она закрыта.
//   categoryId       — категория, в которой перерасход
//   initialAmount    — сколько ₽ нужно покрыть в этой сессии
//   remaining        — сколько ещё осталось распределить
//   pending          — массив { goalId, amount } — «черновик» списаний
//   onResolve        — что вызвать после успешного покрытия
//   onCancel         — что вызвать при отмене
let overflowState = null;

function openOverflowModal(categoryId, amount, callbacks) {
  overflowState = {
    categoryId: categoryId,
    initialAmount: amount,
    remaining: amount,
    pending: [],
    onResolve: callbacks.onResolve || function () {},
    onCancel:  callbacks.onCancel  || function () {},
  };
  document.getElementById("overflowModal").hidden = false;
  renderOverflowModal();
}

function renderOverflowModal() {
  const body = document.getElementById("overflowModalBody");
  body.innerHTML = "";

  const cat = categories.find((c) => c.id === overflowState.categoryId);

  // Заголовок: какая категория и сколько надо покрыть
  const head = document.createElement("div");
  head.innerHTML =
    "Категория: <b>" + (cat ? cat.name : "?") + "</b><br>" +
    "Нужно покрыть: <b>" + formatMoney(overflowState.initialAmount) + " ₽</b>";
  body.append(head);

  // Сколько ещё осталось распределить
  const rem = document.createElement("div");
  rem.className = "modal-remaining";
  if (overflowState.remaining > 0) {
    rem.textContent = "Осталось распределить: " + formatMoney(overflowState.remaining) + " ₽";
  } else {
    rem.textContent = "Полностью покрыто";
    rem.style.color = "#34c759";
  }
  body.append(rem);

  // Список целей, из которых можно взять (с учётом уже выбранных черновиков)
  if (overflowState.remaining > 0) {
    const title = document.createElement("div");
    title.className = "muted";
    title.textContent = "Из какой цели забрать:";
    body.append(title);

    const list = document.createElement("ul");
    list.className = "modal-list";

    for (const g of goals) {
      const pending = overflowState.pending.find((p) => p.goalId === g.id);
      const pendingAmount = pending ? pending.amount : 0;
      const effective = g.accumulated - pendingAmount;
      if (effective <= 0) continue;

      const li = document.createElement("li");

      const label = document.createElement("span");
      label.textContent = g.name + " (доступно " + formatMoney(effective) + " ₽)";

      const btn = document.createElement("button");
      btn.className = "btn btn-primary btn-sm";
      btn.textContent = "Взять";
      btn.addEventListener("click", () => {
        const take = Math.min(overflowState.remaining, effective);
        if (pending) {
          pending.amount += take;
        } else {
          overflowState.pending.push({ goalId: g.id, amount: take });
        }
        overflowState.remaining -= take;
        renderOverflowModal();
      });

      li.append(label, btn);
      list.append(li);
    }

    if (!list.children.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "Нет целей с накоплениями. Отмени операцию или пополни цель.";
      body.append(empty);
    } else {
      body.append(list);
    }
  }

  // Черновик: уже выбранные списания
  if (overflowState.pending.length > 0) {
    const title = document.createElement("div");
    title.className = "muted";
    title.textContent = "Уже выбрано:";
    body.append(title);

    const list = document.createElement("ul");
    list.className = "modal-list";
    for (const p of overflowState.pending) {
      const g = goals.find((gg) => gg.id === p.goalId);
      const li = document.createElement("li");
      li.textContent = (g ? g.name : "?") + ": " + formatMoney(p.amount) + " ₽";
      list.append(li);
    }
    body.append(list);
  }

  // Кнопка «Подтвердить» активна только когда всё распределено
  document.getElementById("overflowConfirmBtn").disabled =
    (overflowState.remaining > 0);
}

function confirmOverflow() {
  const cat = categories.find((c) => c.id === overflowState.categoryId);
  for (const p of overflowState.pending) {
    const g = goals.find((gg) => gg.id === p.goalId);
    if (g) g.accumulated -= p.amount;
  }
  cat.overflow_covered = (cat.overflow_covered || 0) + overflowState.initialAmount;

  const cb = overflowState.onResolve;
  closeOverflowModal();
  cb();
}

function cancelOverflow() {
  const cb = overflowState.onCancel;
  closeOverflowModal();
  cb();
}

function closeOverflowModal() {
  document.getElementById("overflowModal").hidden = true;
  overflowState = null;
}

// =====================================================
//  ДЕЙСТВИЕ: «Закрыть месяц»
//  — сбережения распределяются по целям сверху вниз
//  — spent и overflow_covered у категорий обнуляются
// =====================================================

function closeMonth() {
  if (!confirm(
    "Закрыть месяц?\n\n" +
    "• Сбережения (" + formatMoney(savings) + " ₽) распределятся по целям сверху вниз.\n" +
    "• «Потрачено» у всех категорий обнулится."
  )) return;

  let remaining = savings;
  for (const g of goals) {
    if (remaining <= 0) break;
    const need = Math.max(0, g.target - g.accumulated);
    const add = Math.min(need, remaining);
    g.accumulated += add;
    remaining -= add;
  }

  for (const c of categories) {
    c.spent = 0;
    c.overflow_covered = 0;
  }

  saveCategories();
  saveGoals();

  renderBudget();
  renderGoals();

  if (remaining > 0) {
    alert("Все цели закрыты. Нераспределённый остаток: " + formatMoney(remaining) + " ₽ (остался в кошельке).");
  }
}

// =====================================================
//  ЗАПУСК
// =====================================================

document.getElementById("addAccountBtn").addEventListener("click", addAccount);
document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
document.getElementById("addExpenseBtn").addEventListener("click", addExpense);
document.getElementById("addGoalBtn").addEventListener("click", addGoal);
document.getElementById("closeMonthBtn").addEventListener("click", closeMonth);

document.getElementById("overflowConfirmBtn").addEventListener("click", confirmOverflow);
document.getElementById("overflowCancelBtn").addEventListener("click", cancelOverflow);

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
