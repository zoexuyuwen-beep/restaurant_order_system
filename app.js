// 简单的中式菜单数据
const MENU = [
  { id: 'mapo', name: '麻婆豆腐', desc: '香辣豆腐，花椒微麻，配白饭绝配。', price: 28.0 },
  { id: 'gongbao', name: '宫保鸡丁', desc: '酸甜微辣，花生脆香。', price: 32.0 },
  { id: 'xiao_long_bao', name: '小笼包', desc: '鲜肉汤汁丰富，皮薄多汁（6只）。', price: 26.0 },
  { id: 'chao_fan', name: '扬州炒饭', desc: '粒粒分明，配料丰富。', price: 22.0 },
  { id: 'peking_duck', name: '北京烤鸭（半只）', desc: '皮脆肉嫩，搭配甜面酱。', price: 118.0 },
  { id: 'hotpot', name: '红油抄手', desc: '麻辣鲜香，红油直击味蕾。', price: 24.0 },
  { id: 'qingcai', name: '清炒时蔬', desc: '清爽爽口，健康选择。', price: 18.0 },
  { id: 'dan_tang', name: '蛋汤', desc: '暖胃家常蛋汤。', price: 10.0 }
];

const STORAGE_KEY = 'restaurant_order_v1';

// DOM refs
const menuEl = document.getElementById('menu');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart');
const confirmOrderBtn = document.getElementById('confirm-order');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const cartCountEl = document.getElementById('cart-count');

// Picker modal elements
const quickPickBtn = document.getElementById('quick-pick');
const pickerModal = document.getElementById('picker-modal');
const pickerImg = document.getElementById('picker-img');
const pickerName = document.getElementById('picker-name');
const pickerDesc = document.getElementById('picker-desc');
const pickerPrice = document.getElementById('picker-price');
const pickerRepick = document.getElementById('picker-repick');
const pickerAdd = document.getElementById('picker-add');
const pickerClose = document.getElementById('picker-close');
let currentPicked = null;

// 状态管理
function loadOrder() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}
function saveOrder(order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

// 渲染菜单
function renderMenu() {
  menuEl.innerHTML = '';
  MENU.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="dish-img" src="images/${item.id}.jpg" alt="${item.name}" onerror="this.onerror=null;this.src='images/${item.id}.svg'">
      <div class="title">${item.name}</div>
      <div class="desc">${item.desc}</div>
      <div class="price">¥${item.price.toFixed(2)}</div>
      <div class="actions">
        <div class="qty">
          <button class="btn" data-action="dec" data-id="${item.id}">-</button>
          <div class="count" id="count-${item.id}">0</div>
          <button class="btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
        <button class="btn primary" data-action="add" data-id="${item.id}">加入</button>
      </div>
    `;
    menuEl.appendChild(card);
  });
}

// 渲染购物车
function renderCart() {
  const order = loadOrder();
  const keys = Object.keys(order);
  cartItemsEl.innerHTML = '';
  let total = 0;
  keys.forEach(id => {
    const menuItem = MENU.find(m => m.id === id);
    if (!menuItem) return;
    const qty = order[id];
    const sub = qty * menuItem.price;
    total += sub;

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="meta">
        <div class="name">${menuItem.name}</div>
        <div class="small">¥${menuItem.price.toFixed(2)} × ${qty} = ¥${sub.toFixed(2)}</div>
      </div>
      <div class="controls">
        <div class="qty">
          <button class="btn" data-action="dec" data-id="${id}">-</button>
          <span class="small">${qty}</span>
          <button class="btn" data-action="inc" data-id="${id}">+</button>
        </div>
        <button class="btn danger" data-action="remove" data-id="${id}">删除</button>
      </div>
    `;
    cartItemsEl.appendChild(itemEl);
  });
  cartTotalEl.textContent = `¥${total.toFixed(2)}`;

  // Update counters in menu cards
  MENU.forEach(m => {
    const cntEl = document.getElementById(`count-${m.id}`);
    if (cntEl) cntEl.textContent = order[m.id] || 0;
  });
  // Update header cart count if present
  if (cartCountEl) {
    const count = Object.values(order).reduce((s, v) => s + v, 0);
    cartCountEl.textContent = count;
  }
}

// 修改订单操作
function addItem(id, delta = 1) {
  const order = loadOrder();
  const cur = order[id] || 0;
  order[id] = Math.max(0, cur + delta);
  if (order[id] === 0) delete order[id];
  saveOrder(order);
  renderCart();
}
function removeItem(id) {
  const order = loadOrder();
  delete order[id];
  saveOrder(order);
  renderCart();
}
function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  renderCart();
}

// 事件代理：菜单与购物车的按钮
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');

  if (action === 'inc') addItem(id, 1);
  if (action === 'dec') addItem(id, -1);
  if (action === 'add') addItem(id, 1);
  if (action === 'remove') removeItem(id);
});

clearCartBtn.addEventListener('click', () => {
  if (confirm('确定要清空购物车吗？')) clearCart();
});

// 订单确认流程：展示模态框
confirmOrderBtn.addEventListener('click', () => {
  const order = loadOrder();
  const keys = Object.keys(order);
  if (keys.length === 0) return alert('购物车为空，请先添加菜品。');

  modalBody.innerHTML = '';
  let total = 0;
  const ul = document.createElement('div');
  ul.style.display = 'grid';
  ul.style.gap = '6px';

  keys.forEach(id => {
    const menuItem = MENU.find(m => m.id === id);
    const qty = order[id];
    const sub = qty * menuItem.price;
    total += sub;

    const row = document.createElement('div');
    row.textContent = `${menuItem.name} × ${qty} — ¥${sub.toFixed(2)}`;
    ul.appendChild(row);
  });
  const totalRow = document.createElement('div');
  totalRow.style.marginTop = '10px';
  totalRow.style.fontWeight = '700';
  totalRow.textContent = `总计：¥${total.toFixed(2)}`;

  modalBody.appendChild(ul);
  modalBody.appendChild(totalRow);

  modal.classList.remove('hidden');
});

modalCancel.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

modalConfirm.addEventListener('click', () => {
  // 这里模拟提交：保存一份快照到 localStorage 下的另一个键，并清空购物车
  const order = loadOrder();
  const snapshot = { time: new Date().toISOString(), items: order };
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY + '_history') || '[]');
  history.push(snapshot);
  localStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(history));

  clearCart();
  modal.classList.add('hidden');
  alert('订单已提交（已保存到本地浏览器）。');
  // update cart count display
  if (cartCountEl) cartCountEl.textContent = '0';
});

// 初始加载
renderMenu();
renderCart();

// Random picker logic
function pickRandomDish() {
  const idx = Math.floor(Math.random() * MENU.length);
  return MENU[idx];
}
// --- Invoice / billing logic ---
const billBtn = document.getElementById('bill-btn');
const invoiceModal = document.getElementById('invoice-modal');
const invoiceBody = document.getElementById('invoice-body');
const invoiceTotalEl = document.getElementById('invoice-total');
const invoicePay = document.getElementById('invoice-pay');
const invoiceClose = document.getElementById('invoice-close');

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '_history') || '[]'); } catch (e) { return []; }
}

function renderInvoice() {
  const history = loadHistory();
  invoiceBody.innerHTML = '';
  if (!history || history.length === 0) {
    invoiceBody.innerHTML = '<div class="small-muted">暂无已提交订单。</div>';
    invoiceTotalEl.textContent = '¥0.00';
    return;
  }

  let grandTotal = 0;
  history.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'invoice-entry';
    const time = new Date(entry.time).toLocaleString();
    let html = `<div class="entry-time">提交时间: ${time}</div><div class="entry-items">`;
    const items = entry.items || {};
    Object.keys(items).forEach(id => {
      const menuItem = MENU.find(m => m.id === id) || { name: id, price: 0 };
      const qty = items[id];
      const sub = qty * menuItem.price;
      grandTotal += sub;
      html += `<div>${menuItem.name} × ${qty} — ¥${sub.toFixed(2)}</div>`;
    });
    html += '</div>';
    entryEl.innerHTML = html;
    invoiceBody.appendChild(entryEl);
  });

  invoiceTotalEl.textContent = `¥${grandTotal.toFixed(2)}`;
}

if (billBtn) billBtn.addEventListener('click', () => {
  renderInvoice();
  invoiceModal.classList.remove('hidden');
});
if (invoiceClose) invoiceClose.addEventListener('click', () => invoiceModal.classList.add('hidden'));
if (invoiceModal) invoiceModal.addEventListener('click', e => { if (e.target === invoiceModal) invoiceModal.classList.add('hidden'); });

if (invoicePay) invoicePay.addEventListener('click', () => {
  const history = loadHistory();
  if (!history || history.length === 0) return alert('没有需要支付的账单。');
  if (!confirm('确认支付并清空账单历史？此操作不可撤销。')) return;
  localStorage.removeItem(STORAGE_KEY + '_history');
  renderInvoice();
  alert('支付成功，账单已清空。');
});

function showPicker(dish) {
  currentPicked = dish;
  pickerImg.alt = dish.name;
  pickerImg.onerror = null;
  pickerImg.src = `images/${dish.id}.jpg`;
  pickerImg.onerror = () => { pickerImg.onerror = null; pickerImg.src = `images/${dish.id}.svg`; };
  pickerName.textContent = dish.name;
  pickerDesc.textContent = dish.desc;
  pickerPrice.textContent = `¥${dish.price.toFixed(2)}`;
  pickerModal.classList.remove('hidden');
}

function hidePicker() {
  pickerModal.classList.add('hidden');
}

if (quickPickBtn) {
  quickPickBtn.addEventListener('click', () => {
    const d = pickRandomDish();
    showPicker(d);
  });
}

if (pickerRepick) pickerRepick.addEventListener('click', () => showPicker(pickRandomDish()));
if (pickerAdd) pickerAdd.addEventListener('click', () => {
  if (!currentPicked) return;
  addItem(currentPicked.id, 1);
  hidePicker();
});
if (pickerClose) pickerClose.addEventListener('click', () => hidePicker());
if (pickerModal) pickerModal.addEventListener('click', e => { if (e.target === pickerModal) hidePicker(); });