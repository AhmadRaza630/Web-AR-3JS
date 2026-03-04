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

// Simple dashboard
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Food AR Orders Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #020617;
      color: #e5e7eb;
      min-height: 100vh;
    }
    .wrapper {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
    }
    .subtitle {
      margin: 0 0 16px;
      font-size: 13px;
      color: #9ca3af;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      background: #020617;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.4);
      font-size: 13px;
      vertical-align: top;
    }
    th {
      text-align: left;
      background: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      background: rgba(250, 204, 21, 0.15);
      color: #facc15;
    }
    .status-pending {
      background: rgba(250, 204, 21, 0.15);
      color: #facc15;
    }
    .status-done {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }
    .no-orders {
      padding: 24px 0;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }
    .small {
      font-size: 11px;
      color: #64748b;
    }
    button {
      padding: 4px 10px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      font-size: 11px;
    }
    .btn-mark-done {
      background: #22c55e;
      color: #022c22;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .refresh-info {
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="top-bar">
      <div>
        <h1>Food AR Orders</h1>
        <p class="subtitle">Live dashboard – table wise orders.</p>
      </div>
      <div class="refresh-info">Auto refresh every 5s</div>
    </div>
    <div id="orders-root"></div>
  </div>

  <script>
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!data.ok) throw new Error('Failed');
        renderOrders(data.orders || []);
      } catch (e) {
        document.getElementById('orders-root').innerHTML =
          '<div class="no-orders">Error loading orders.</div>';
      }
    }

    function renderOrders(orders) {
      if (!orders.length) {
        document.getElementById('orders-root').innerHTML =
          '<div class="no-orders">Abhi tak koi order nahi aaya.</div>';
        return;
      }

      const rows = orders.map((o) => {
        const itemsText = (o.items || [])
          .map(i => (i.emoji || '') + ' ' + (i.name || i.id))
          .join(', ');
        const statusClass = o.status === 'done' ? 'status-done' : 'status-pending';
        const created = new Date(o.createdAt).toLocaleTimeString();
        return '<tr>' +
          '<td>#' + o.id + '</td>' +
          '<td><span class="badge">Table ' + o.tableNumber + '</span></td>' +
          '<td>' + itemsText + '<br/><span class="small">Count: ' + (o.items || []).length + '</span></td>' +
          '<td>Rs ' + (o.total || 0) + '</td>' +
          '<td><span class="badge ' + statusClass + '">' + o.status + '</span><br/><span class="small">' + created + '</span></td>' +
        '</tr>';
      }).join('');

      document.getElementById('orders-root').innerHTML =
        '<table><thead><tr>' +
        '<th>ID</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th>' +
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

