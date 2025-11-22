const STORAGE_KEY = 'restaurant_order_v1';
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

const cartList = document.getElementById('cart-list');
const clearFullBtn = document.getElementById('clear-cart-full');
const confirmFullBtn = document.getElementById('confirm-order-full');

function loadOrder() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
}
function saveOrder(order) { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); }

function renderFullCart() {
  const order = loadOrder();
  cartList.innerHTML = '';
  const keys = Object.keys(order);
  if (keys.length === 0) {
    cartList.innerHTML = '<div class="small-muted">购物车为空。返回菜单添加菜品。</div>';
    return;
  }
  let total = 0;
  keys.forEach(id => {
    const item = MENU.find(m => m.id === id);
    const qty = order[id];
    const sub = qty * item.price;
    total += sub;

    const row = document.createElement('div');
    row.className = 'dish-row';
    row.innerHTML = `
      <img src="images/${id}.jpg" alt="${item.name}" onerror="this.onerror=null;this.src='images/${id}.svg'">
      <div class="dish-meta">
        <div style="font-weight:700">${item.name}</div>
        <div class="small-muted">¥${item.price.toFixed(2)} × <input type="number" min="0" step="1" value="${qty}" data-id="${id}" class="qty-input" style="width:64px;margin-left:6px"> = ¥${sub.toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn danger" data-action="remove" data-id="${id}">删除</button>
      </div>
    `;
    cartList.appendChild(row);
  });

  const totalRow = document.createElement('div');
  totalRow.style.fontWeight = '700';
  totalRow.style.marginTop = '12px';
  totalRow.textContent = `总计：¥${total.toFixed(2)}`;
  cartList.appendChild(totalRow);
}

cartList.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (btn.getAttribute('data-action') === 'remove') {
    const order = loadOrder();
    delete order[id];
    saveOrder(order);
    renderFullCart();
  }
});

cartList.addEventListener('change', e => {
  const input = e.target.closest('.qty-input');
  if (!input) return;
  const id = input.getAttribute('data-id');
  const val = parseInt(input.value, 10) || 0;
  const order = loadOrder();
  if (val <= 0) delete order[id]; else order[id] = val;
  saveOrder(order);
  renderFullCart();
});

clearFullBtn.addEventListener('click', () => {
  if (confirm('确定要清空购物车吗？')) {
    localStorage.removeItem(STORAGE_KEY);
    renderFullCart();
  }
});

confirmFullBtn.addEventListener('click', () => {
  const order = loadOrder();
  const keys = Object.keys(order);
  if (keys.length === 0) return alert('购物车为空，无法提交。');
  const snapshot = { time: new Date().toISOString(), items: order };
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY + '_history') || '[]');
  history.push(snapshot);
  localStorage.setItem(STORAGE_KEY + '_history', JSON.stringify(history));
  localStorage.removeItem(STORAGE_KEY);
  alert('订单已提交并保存到本地历史。');
  renderFullCart();
});

// initial
renderFullCart();

// --- picker support for cart page
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

function pickRandomDish() {
  const idx = Math.floor(Math.random() * MENU.length);
  return MENU[idx];
}

function showPicker(dish) {
  currentPicked = dish;
  pickerImg.src = `images/${dish.id}.svg`;
  pickerImg.alt = dish.name;
  pickerName.textContent = dish.name;
  pickerDesc.textContent = dish.desc;
  pickerPrice.textContent = `¥${dish.price.toFixed(2)}`;
  pickerModal.classList.remove('hidden');
}

function hidePicker() { pickerModal.classList.add('hidden'); }

if (quickPickBtn) quickPickBtn.addEventListener('click', () => showPicker(pickRandomDish()));
if (pickerRepick) pickerRepick.addEventListener('click', () => showPicker(pickRandomDish()));
if (pickerAdd) pickerAdd.addEventListener('click', () => {
  if (!currentPicked) return;
  const order = loadOrder();
  order[currentPicked.id] = (order[currentPicked.id] || 0) + 1;
  saveOrder(order);
  renderFullCart();
  hidePicker();
});
if (pickerClose) pickerClose.addEventListener('click', () => hidePicker());
if (pickerModal) pickerModal.addEventListener('click', e => { if (e.target === pickerModal) hidePicker(); });

// --- Invoice / billing logic for cart page
const billBtn = document.getElementById('bill-btn');
const invoiceModal = document.getElementById('invoice-modal');
const invoiceBody = document.getElementById('invoice-body');
const invoiceTotalEl = document.getElementById('invoice-total');
const invoicePay = document.getElementById('invoice-pay');
const invoiceClose = document.getElementById('invoice-close');

function loadHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '_history') || '[]'); } catch (e) { return []; } }

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

if (billBtn) billBtn.addEventListener('click', () => { renderInvoice(); invoiceModal.classList.remove('hidden'); });
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