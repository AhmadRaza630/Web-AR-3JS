const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend files from this folder
app.use(express.static(__dirname));

// In-memory order store (for demo; replace with DB in production)
let orders = [];
let nextId = 1;

// Create new order
app.post('/api/orders', (req, res) => {
  const { tableNumber, items, total } = req.body || {};

  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: 'Invalid order payload' });
  }

  const order = {
    id: nextId++,
    tableNumber: String(tableNumber),
    items,
    total: Number(total) || 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  console.log('New order:', order);

  res.json({ ok: true, order });
});

// List all orders (for dashboard)
app.get('/api/orders', (req, res) => {
  res.json({ ok: true, orders });
});

// Admin dashboard (SPA-style) with real Orders + dummy sections
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bistro Augmented – Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f3f4f6;
      color: #111827;
      min-height: 100vh;
    }
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
    }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: sticky; top: 0; z-index: 20; display: flex; overflow-x: auto; }
    }
    .sidebar {
      background: #111827;
      color: #e5e7eb;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 8px;
    }
    .sidebar-logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #111827;
    }
    .sidebar-logo-text {
      font-size: 16px;
      font-weight: 600;
    }
    .nav-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin: 4px 8px;
    }
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    @media (max-width: 900px) {
      .nav-list {
        flex-direction: row;
        overflow-x: auto;
      }
    }
    .nav-item-btn {
      width: 100%;
      border: none;
      background: transparent;
      color: inherit;
      padding: 8px 10px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
    }
    .nav-item-btn span.icon {
      width: 20px;
      text-align: center;
      font-size: 15px;
    }
    .nav-item-btn.active {
      background: #f97316;
      color: #111827;
    }
    .nav-item-btn:not(.active):hover {
      background: rgba(31, 41, 55, 0.8);
    }
    .sidebar-footer {
      margin-top: auto;
      font-size: 11px;
      color: #6b7280;
      padding: 4px 8px;
    }
    .main {
      padding: 16px 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .topbar {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .topbar-title {
      font-size: 22px;
      font-weight: 600;
    }
    .topbar-search {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topbar-search input {
      border-radius: 999px;
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      font-size: 13px;
      min-width: 180px;
    }
    .topbar-user {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .topbar-avatar {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: #111827;
      color: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
    }
    .content {
      display: none;
      gap: 16px;
    }
    .content.active {
      display: grid;
    }
    .content-dashboard {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }
    .content-orders {
      grid-template-columns: minmax(0, 1fr);
    }
    .card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
      padding: 14px 16px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
    }
    .pill {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .orders-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .order-column-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      padding: 4px 8px;
      border-radius: 999px;
    }
    .order-column-title.pending { background: #fee2e2; color: #b91c1c; }
    .order-column-title.inprocess { background: #fef3c7; color: #b45309; }
    .order-column-title.delivered { background: #dcfce7; color: #15803d; }
    .order-column-title.completed { background: #e5e7eb; color: #374151; }
    .order-card {
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      background: #ffffff;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .order-card-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .order-card-items {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .order-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #6b7280;
    }
    .status-chip {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
    }
    .status-chip.pending { background: #fef3c7; color: #b45309; }
    .status-chip.done { background: #dcfce7; color: #15803d; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 6px;
    }
    th, td {
      padding: 8px 8px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    th { background: #f9fafb; font-weight: 500; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .muted {
      font-size: 12px;
      color: #6b7280;
    }
    .placeholder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .placeholder-tile {
      border-radius: 14px;
      border: 1px dashed #d1d5db;
      padding: 14px 16px;
      background: #f9fafb;
      font-size: 13px;
      color: #6b7280;
    }
    .placeholder-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-badge">BA</div>
        <div class="sidebar-logo-text">Bistro Augmented</div>
      </div>
      <div class="nav-section-title">Main</div>
      <ul class="nav-list">
        <li><button class="nav-item-btn active" data-section="dashboard"><span class="icon">🏠</span>Dashboard</button></li>
        <li><button class="nav-item-btn" data-section="orders"><span class="icon">🧾</span>Orders</button></li>
        <li><button class="nav-item-btn" data-section="menu"><span class="icon">📋</span>Menu Management</button></li>
        <li><button class="nav-item-btn" data-section="ar-dishes"><span class="icon">🕶️</span>AR Dishes</button></li>
        <li><button class="nav-item-btn" data-section="waiters"><span class="icon">🧑‍🍳</span>Waiters</button></li>
        <li><button class="nav-item-btn" data-section="tables"><span class="icon">🍽️</span>Tables</button></li>
        <li><button class="nav-item-btn" data-section="customers"><span class="icon">👥</span>Customers</button></li>
        <li><button class="nav-item-btn" data-section="analytics"><span class="icon">📈</span>Analytics</button></li>
        <li><button class="nav-item-btn" data-section="settings"><span class="icon">⚙️</span>Settings</button></li>
      </ul>
      <div class="sidebar-footer">
        Demo admin • Only Orders data is live.
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div>
          <div class="topbar-title" id="topbar-title">Dashboard</div>
          <div class="muted" id="topbar-subtitle">Overview of tables and orders.</div>
        </div>
        <div class="topbar-search">
          <input type="search" placeholder="Search orders or tables…" />
          <div class="topbar-user">
            <span class="topbar-avatar">AD</span>
            <span>Admin</span>
          </div>
        </div>
      </div>

      <!-- Dashboard content -->
      <section class="content content-dashboard active" id="section-dashboard">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Orders Management</div>
            <span class="pill">Live</span>
          </div>
          <div class="muted">New, in-process, delivered and completed orders at a glance.</div>
          <div id="orders-board" style="margin-top:12px;"></div>
        </div>
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Menu Management</div>
            <button style="border:none;border-radius:999px;background:#f97316;color:white;font-size:12px;padding:6px 10px;cursor:pointer;">Add New Dish</button>
          </div>
          <div class="muted">Demo list – static for now.</div>
          <ul style="list-style:none;padding:8px 0 0;margin:0;font-size:13px;">
            <li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;">
              <span>Cheese Burger</span><span>Rs 850</span>
            </li>
            <li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;">
              <span>Loaded Pizza</span><span>Rs 1290</span>
            </li>
            <li style="display:flex;justify-content:space-between;padding:6px 0;">
              <span>Crispy Fries</span><span>Rs 490</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Orders table -->
      <section class="content content-orders" id="section-orders">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Orders List</div>
            <span class="muted" id="orders-count-label">0 orders</span>
          </div>
          <div id="orders-table-root"></div>
        </div>
      </section>

      <!-- Dummy sections -->
      <section class="content" id="section-menu">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Menu Management (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Food Items</div>
              Add, edit or remove dishes here in the real app.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">AR Price Tags</div>
              Configure AR pricing overlays for each dish.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-ar-dishes">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">AR Dishes (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">3D Models</div>
              Upload, test and approve 3D models for AR.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">Placement Presets</div>
              Configure default scale and height per dish.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-waiters">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Waiter Management (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Waiter List</div>
              In production, you will assign tables to waiters here.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">Performance</div>
              Track orders served per waiter.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-tables">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Tables Management (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Layout</div>
              Design your floor layout and QR codes per table.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">Occupancy</div>
              Show table occupancy in real time.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-customers">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Customers (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Customer List</div>
              Loyalty, visit history and feedback will appear here.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">Segments</div>
              Group customers for targeted campaigns.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-analytics">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Analytics (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Today</div>
              Total orders, AR launches and revenue widgets can go here.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">Trends</div>
              Graphs for popular dishes and busy hours.
            </div>
          </div>
        </div>
      </section>

      <section class="content" id="section-settings">
        <div class="card">
          <div class="card-title-row">
            <div class="card-title">Settings (Demo)</div>
          </div>
          <div class="placeholder-grid">
            <div class="placeholder-tile">
              <div class="placeholder-title">Restaurant Profile</div>
              Name, logo and contact information.
            </div>
            <div class="placeholder-tile">
              <div class="placeholder-title">AR Settings</div>
              Configure device compatibility and defaults.
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const navButtons = document.querySelectorAll('.nav-item-btn');
    const sections = {
      dashboard: document.getElementById('section-dashboard'),
      orders: document.getElementById('section-orders'),
      menu: document.getElementById('section-menu'),
      'ar-dishes': document.getElementById('section-ar-dishes'),
      waiters: document.getElementById('section-waiters'),
      tables: document.getElementById('section-tables'),
      customers: document.getElementById('section-customers'),
      analytics: document.getElementById('section-analytics'),
      settings: document.getElementById('section-settings')
    };
    const titleEl = document.getElementById('topbar-title');
    const subtitleEl = document.getElementById('topbar-subtitle');

    function setSection(id) {
      Object.keys(sections).forEach(key => {
        if (sections[key]) {
          sections[key].classList.toggle('active', key === id);
        }
      });
      navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-section') === id);
      });
      const titles = {
        dashboard: ['Dashboard', 'Overview of tables and orders.'],
        orders: ['Orders', 'Live list of all Web AR orders.'],
        menu: ['Menu Management', 'Dummy screen – static cards only.'],
        'ar-dishes': ['AR Dishes', 'Configure AR models (demo).'],
        waiters: ['Waiters', 'Assign tables to staff (demo).'],
        tables: ['Tables', 'Manage floor layout (demo).'],
        customers: ['Customers', 'Customer list and loyalty (demo).'],
        analytics: ['Analytics', 'See performance charts (demo).'],
        settings: ['Settings', 'Basic restaurant and AR settings (demo).']
      };
      const pair = titles[id] || ['Dashboard', ''];
      titleEl.textContent = pair[0];
      subtitleEl.textContent = pair[1];
    }

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-section');
        setSection(id);
      });
    });

    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
        const orders = data.orders || [];
        renderOrdersBoard(orders);
        renderOrdersTable(orders);
      } catch (e) {
        document.getElementById('orders-board').innerHTML =
          '<div class="muted">Error loading orders.</div>';
        document.getElementById('orders-table-root').innerHTML =
          '<div class="muted">Error loading orders.</div>';
      }
    }

    function groupByStatus(orders) {
      const columns = { pending: [], inprocess: [], delivered: [], completed: [] };
      orders.forEach(o => {
        const status = (o.status || 'pending').toLowerCase();
        if (status === 'done' || status === 'completed') {
          columns.completed.push(o);
        } else if (status === 'delivered') {
          columns.delivered.push(o);
        } else if (status === 'in process' || status === 'in_process') {
          columns.inprocess.push(o);
        } else {
          columns.pending.push(o);
        }
      });
      return columns;
    }

    function renderOrdersBoard(orders) {
      const root = document.getElementById('orders-board');
      if (!orders.length) {
        root.innerHTML = '<div class="muted">Abhi tak koi order nahi aaya.</div>';
        return;
      }
      const grouped = groupByStatus(orders);
      const makeColumn = (label, key, className) => {
        const list = grouped[key] || [];
        const cards = list.map(o => {
          const itemsText = (o.items || [])
            .map(i => (i.emoji || '') + ' ' + (i.name || i.id))
            .join(', ');
          const created = new Date(o.createdAt).toLocaleTimeString();
          const statusClass = (o.status || '').toLowerCase() === 'done' ? 'done' : 'pending';
          return '<div class="order-card">' +
            '<div class="order-card-header"><span>Table ' + o.tableNumber + '</span><span>#' + o.id + '</span></div>' +
            '<div class="order-card-items">' + itemsText + '</div>' +
            '<div class="order-card-footer"><span>' + created + '</span>' +
            '<span class="status-chip ' + statusClass + '">' + (o.status || 'pending') + '</span></div>' +
            '</div>';
        }).join('');
        return '<div><div class="order-column-title ' + className + '">' + label +
          '</div>' + cards + '</div>';
      };
      root.innerHTML =
        '<div class="orders-grid">' +
        makeColumn('New Orders', 'pending', 'pending') +
        makeColumn('In Process', 'inprocess', 'inprocess') +
        makeColumn('Delivered', 'delivered', 'delivered') +
        makeColumn('Completed', 'completed', 'completed') +
        '</div>';
    }

    function renderOrdersTable(orders) {
      const root = document.getElementById('orders-table-root');
      const countLabel = document.getElementById('orders-count-label');
      countLabel.textContent = orders.length + (orders.length === 1 ? ' order' : ' orders');
      if (!orders.length) {
        root.innerHTML = '<div class="muted">Abhi tak koi order nahi aaya.</div>';
        return;
      }
      const rows = orders.map(o => {
        const itemsText = (o.items || [])
          .map(i => (i.emoji || '') + ' ' + (i.name || i.id))
          .join(', ');
        const created = new Date(o.createdAt).toLocaleTimeString();
        return '<tr>' +
          '<td>#' + o.id + '</td>' +
          '<td><span class="badge">Table ' + o.tableNumber + '</span></td>' +
          '<td>' + itemsText + '</td>' +
          '<td>Rs ' + (o.total || 0) + '</td>' +
          '<td class="muted">' + created + '</td>' +
        '</tr>';
      }).join('');
      root.innerHTML =
        '<table><thead><tr>' +
        '<th>ID</th><th>Table</th><th>Items</th><th>Total</th><th>Time</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';
    }

    fetchOrders();
    setInterval(fetchOrders, 5000);
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

