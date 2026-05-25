// app.js — логика приложения «Бюджет».
// Шаг 5: ручной ввод расхода — уменьшает остаток категории и баланс счёта.

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

document.getElementById("savingsValue").addEventListener("change", (e) => {
  savings = Number(e.target.value) || 0;
  saveSavings();
  updateWarning();
});

renderWallet();
renderBudget();
renderSavings();
renderExpenseForm();
