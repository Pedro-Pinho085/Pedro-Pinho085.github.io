'use strict';

const loginScreen  = document.getElementById('loginScreen');
const adminWrap    = document.getElementById('adminWrap');
const loginError   = document.getElementById('loginError');
const productModal = document.getElementById('productModal');
const confirmModal = document.getElementById('confirmModal');

let allOrders = [], allProducts = [], pendingDeleteId = null;

// ── Auth ──────────────────────────────────────────────
async function checkAuth() {
  const res  = await fetch('/api/admin/check');
  const data = await res.json();
  if (data.logged) showAdmin();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  loginError.textContent = '';
  const res  = await fetch('/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('loginUser').value.trim(),
      password: document.getElementById('loginPass').value
    })
  });
  const data = await res.json();
  if (res.ok) showAdmin();
  else loginError.textContent = data.error || 'Credenciais inválidas';
});

document.getElementById('loginPass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  location.reload();
});

function showAdmin() {
  loginScreen.style.display = 'none';
  adminWrap.style.display   = 'flex';
  loadOrders(); loadProducts();
}

// ── Tabs ──────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('tab-' + link.dataset.tab).classList.add('active');
  });
});

// ── Orders ────────────────────────────────────────────
async function loadOrders() {
  const res = await fetch('/api/admin/orders');
  allOrders = await res.json();
  renderOrders();
}

document.getElementById('refreshOrders').addEventListener('click', loadOrders);
document.getElementById('statusFilter').addEventListener('change', renderOrders);

function renderOrders() {
  const filter  = document.getElementById('statusFilter').value;
  const orders  = filter ? allOrders.filter(o => o.status === filter) : allOrders;
  const el      = document.getElementById('ordersTable');

  if (!orders.length) {
    el.innerHTML = '<p style="color:#888;margin-top:16px">Nenhum pedido encontrado.</p>';
    return;
  }

  const statuses = ['pendente','confirmado','separando','entregue','cancelado'];
  el.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>#</th><th>Cliente</th><th>Contato</th><th>Itens</th><th>Total</th><th>Data</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${escHtml(o.customer_name)}</td>
            <td>${o.customer_phone ? `<a href="https://wa.me/55${o.customer_phone.replace(/\D/g,'')}" target="_blank" style="color:#25D366;font-weight:700">📱 ${escHtml(o.customer_phone)}</a>` : '<span style="color:#ccc">—</span>'}</td>
            <td><ul class="order-items-list">${o.items.map(i => `<li>• ${escHtml(i.product_name)} × ${i.quantity} ${escHtml(i.unit||'un')}</li>`).join('')}</ul></td>
            <td><strong style="color:#CC1E1E">R$ ${fmtBRL(o.total)}</strong></td>
            <td style="white-space:nowrap">${fmtDate(o.created_at)}</td>
            <td>
              <select class="status-select" onchange="updateStatus(${o.id}, this.value)">
                ${statuses.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${capitalize(s)}</option>`).join('')}
              </select>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function updateStatus(id, status) {
  await fetch(`/api/admin/orders/${id}/status`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const o = allOrders.find(x => x.id === id);
  if (o) o.status = status;
}

// ── Products ──────────────────────────────────────────
async function loadProducts() {
  const res   = await fetch('/api/admin/products');
  allProducts = await res.json();
  renderProducts();
}

function renderProducts() {
  const el = document.getElementById('productsTable');
  if (!allProducts.length) {
    el.innerHTML = '<p style="color:#888;margin-top:16px">Nenhum produto cadastrado.</p>';
    return;
  }
  el.innerHTML = `
    <table class="data-table">
      <thead><tr><th>ID</th><th>Img</th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Unid.</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>
        ${allProducts.map(p => `
          <tr>
            <td>${p.id}</td>
            <td><img class="prod-thumb" src="${escHtml(p.img_url)}" alt="" onerror="this.style.opacity='.2'"></td>
            <td><strong>${escHtml(p.name)}</strong><br><small style="color:#888">${escHtml(p.description)}</small></td>
            <td>${escHtml(p.category)}</td>
            <td><strong style="color:#CC1E1E">R$ ${fmtBRL(p.price)}</strong></td>
            <td>${escHtml(p.unit)}</td>
            <td><span class="status-badge ${p.active ? 'status-entregue' : 'status-cancelado'}">${p.active ? 'Ativo' : 'Inativo'}</span></td>
            <td style="white-space:nowrap">
              <button class="btn-primary" style="padding:6px 12px;font-size:13px" onclick="openEditProduct(${p.id})">✏️ Editar</button>
              <button class="btn-danger" style="padding:6px 12px;font-size:13px;margin-left:4px" onclick="confirmDelete(${p.id})">🚫 Desativar</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());

function openProductModal(p = null) {
  document.getElementById('productModalTitle').textContent = p ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('productId').value    = p ? p.id : '';
  document.getElementById('pName').value         = p ? p.name : '';
  document.getElementById('pDesc').value         = p ? p.description : '';
  document.getElementById('pPrice').value        = p ? p.price : '';
  document.getElementById('pImg').value          = p ? p.img_url : '';
  document.getElementById('pUnit').value         = p ? p.unit : 'un';
  document.getElementById('pCategory').value     = p ? p.category : 'Pães';
  document.getElementById('pActive').value       = p ? p.active : '1';
  productModal.style.display = 'flex';
}

function openEditProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (p) openProductModal(p);
}

document.getElementById('productModalCancel').addEventListener('click', () => { productModal.style.display = 'none'; });

document.getElementById('productModalSave').addEventListener('click', async () => {
  const id   = document.getElementById('productId').value;
  const body = {
    name:        document.getElementById('pName').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
    price:       parseFloat(document.getElementById('pPrice').value),
    img_url:     document.getElementById('pImg').value.trim(),
    unit:        document.getElementById('pUnit').value,
    category:    document.getElementById('pCategory').value,
    active:      parseInt(document.getElementById('pActive').value),
  };
  if (!body.name || isNaN(body.price)) { alert('Nome e preço são obrigatórios.'); return; }
  const url    = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  productModal.style.display = 'none';
  loadProducts();
});

function confirmDelete(id) {
  pendingDeleteId = id;
  confirmModal.style.display = 'flex';
}

document.getElementById('confirmCancel').addEventListener('click', () => { confirmModal.style.display = 'none'; pendingDeleteId = null; });
document.getElementById('confirmOk').addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  await fetch(`/api/admin/products/${pendingDeleteId}`, { method: 'DELETE' });
  confirmModal.style.display = 'none';
  pendingDeleteId = null;
  loadProducts();
});

// ── Helpers ───────────────────────────────────────────
function fmtBRL(n) { return Number(n).toFixed(2).replace('.', ','); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

checkAuth();
