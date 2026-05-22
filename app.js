// app.js — логика приложения «Бюджет».
// Шаг 2: блок «Кошелёк» — счета (добавление, удаление, авто-сумма).

// --- Хранение данных ---
const ACCOUNTS_KEY = "budget_app_accounts";

// Счета по умолчанию (показываются при самом первом запуске)
const DEFAULT_ACCOUNTS = [
  { id: 1, name: "Т-Банк", balance: 100000 },
  { id: 2, name: "Сбер", balance: 1200 },
  { id: 3, name: "Наличные", balance: 58300 },
];

// Загрузить счета из памяти браузера
function loadAccounts() {
  const saved = localStorage.getItem(ACCOUNTS_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_ACCOUNTS;
}

// Сохранить счета в память браузера
function saveAccounts() {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

let accounts = loadAccounts();

// --- Вспомогательное ---
// Красивый формат числа: 100000 -> "100 000"
function formatMoney(n) {
  return n.toLocaleString("ru-RU");
}

// --- Отрисовка блока «Кошелёк» ---
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
}

// --- Действия со счетами ---
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

// --- Запуск ---
document.getElementById("addAccountBtn").addEventListener("click", addAccount);
renderWallet();
