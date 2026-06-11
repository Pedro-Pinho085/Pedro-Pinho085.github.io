'use strict';

// ── State ─────────────────────────────────────────────
let products     = [];
let filtered     = [];
let cart         = [];
let activeCategory = '';
let searchQuery  = '';

// ── DOM ───────────────────────────────────────────────
const productGrid   = document.getElementById('productGrid');
const sectionTitle  = document.getElementById('sectionTitle');
const productCount  = document.getElementById('productCount');
const cartDrawer    = document.getElementById('cartDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const cartItemsEl   = document.getElementById('cartItems');
const drawerFooter  = document.getElementById('drawerFooter');
const cartTotalEl   = document.getElementById('cartTotal');
const cartBadge     = document.getElementById('cartBadge');
const checkoutBtn   = document.getElementById('checkoutBtn');
const modalOverlay  = document.getElementById('modalOverlay');
const modalMsg      = document.getElementById('modalMsg');
const whatsappLink  = document.getElementById('whatsappLink');
const searchInput   = document.getElementById('searchInput');

// ── Init ──────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('/api/products');
    products  = await res.json();
    filtered  = products;
    renderProducts();
  } catch {
    productGrid.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Erro ao carregar produtos. Tente recarregar a página.</p>
      </div>`;
  }
}

// ── Category filter ───────────────────────────────────
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    applyFilters();
  });
});

// ── Search ─────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  applyFilters();
});

function applyFilters() {
  filtered = products.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory;
    const matchQ   = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);
    return matchCat && matchQ;
  });

  const label = activeCategory || (searchQuery ? `"${searchQuery}"` : 'Todos os Produtos');
  sectionTitle.textContent = label;
  renderProducts();
}

// ── Render products ───────────────────────────────────
function renderProducts() {
  productCount.textContent = `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <span>🔍</span>
        <p>Nenhum produto encontrado.<br>Tente outra busca.</p>
      </div>`;
    return;
  }

  productGrid.innerHTML = '';
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-cat-ribbon">${escHtml(p.category)}</div>
      <img class="product-card-img" src="${escHtml(p.img_url)}" alt="${escHtml(p.name)}"
           onerror="this.src='https://via.placeholder.com/200x160/FFF5F5/CC1E1E?text=${encodeURIComponent(p.name.split(' ')[0])}'">
      <div class="product-card-body">
        <div class="product-card-name">${escHtml(p.name)}</div>
        <div class="product-card-desc">${escHtml(p.description)}</div>
        <div class="product-card-footer">
          <div>
            <div class="product-card-price">R$ ${fmtBRL(p.price)}</div>
            <div class="product-card-unit">por ${escHtml(p.unit)}</div>
          </div>
          <button class="btn-add" data-id="${p.id}" title="Adicionar ao carrinho">+</button>
        </div>
      </div>`;
    productGrid.appendChild(card);
  });

  productGrid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = products.find(x => x.id == btn.dataset.id);
      if (p) addToCart(p);
    });
  });
}

// ── Cart ───────────────────────────────────────────────
function addToCart(product) {
  const existing = cart.find(x => x.product.id === product.id);
  if (existing) { existing.quantity += 1; }
  else { cart.push({ product, quantity: 1 }); }
  updateCartUI();
  openDrawer();
  showToast(`✅ ${product.name} adicionado!`);
}

function changeQty(productId, delta) {
  const idx = cart.findIndex(x => x.product.id === productId);
  if (idx === -1) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((s, x) => s + x.quantity, 0);
  const totalPrice = cart.reduce((s, x) => s + x.product.price * x.quantity, 0);

  cartBadge.textContent = totalItems;
  cartBadge.hidden      = !totalItems;
  drawerFooter.style.display = cart.length ? 'flex' : 'none';
  cartTotalEl.textContent    = `R$ ${fmtBRL(totalPrice)}`;

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p>Carrinho vazio!<br>Adicione produtos ao lado.</p>
      </div>`;
    return;
  }

  cartItemsEl.innerHTML = '';
  cart.forEach(({ product: p, quantity }) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${escHtml(p.img_url)}" alt="${escHtml(p.name)}"
           onerror="this.src='https://via.placeholder.com/54x54/FFF5F5/CC1E1E?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(p.name)}</div>
        <div class="cart-item-unit">R$ ${fmtBRL(p.price)} / ${escHtml(p.unit)}</div>
        <div class="cart-item-sub">R$ ${fmtBRL(p.price * quantity)}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${p.id}" data-d="-1">−</button>
        <span class="qty-num">${quantity}</span>
        <button class="qty-btn" data-id="${p.id}" data-d="1">+</button>
      </div>`;
    cartItemsEl.appendChild(div);
  });

  cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), Number(btn.dataset.d)));
  });
}

// ── Drawer ─────────────────────────────────────────────
function openDrawer() {
  cartDrawer.classList.add('open');
  drawerOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  cartDrawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartTrigger').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// ── Checkout ───────────────────────────────────────────
checkoutBtn.addEventListener('click', async () => {
  const name  = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!name) {
    document.getElementById('customerName').focus();
    showToast('⚠️ Informe seu nome antes de confirmar');
    return;
  }
  if (!cart.length) return;

  checkoutBtn.disabled     = true;
  checkoutBtn.textContent  = 'Enviando…';

  try {
    const payload = {
      customer_name: name,
      customer_phone: phone,
      items: cart.map(x => ({ product_id: x.product.id, quantity: x.quantity }))
    };
    const res  = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar pedido');

    // ← Substitua pelo número real do Freitas Mercadinho
    const WHATSAPP_NUMBER = '5500000000000';
    const encoded = encodeURIComponent(data.whatsapp_msg);
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    modalMsg.textContent = `Pedido #${data.order_id} registrado com sucesso! Total: R$ ${fmtBRL(data.total)}`;
    modalOverlay.style.display = 'flex';

    cart = [];
    document.getElementById('customerName').value  = '';
    document.getElementById('customerPhone').value = '';
    updateCartUI();
    closeDrawer();

  } catch (err) {
    showToast('❌ ' + (err.message || 'Falha ao enviar pedido'));
  } finally {
    checkoutBtn.disabled    = false;
    checkoutBtn.textContent = '✅ Confirmar Pedido';
  }
});

document.getElementById('modalClose').addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

// ── Helpers ────────────────────────────────────────────
function fmtBRL(n) { return Number(n).toFixed(2).replace('.', ','); }
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

init();
