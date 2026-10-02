import { useEffect, useState } from 'react';
import client from '../api/client';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

const EMPTY_FORM = { sku: '', name: '', description: '', unitPrice: '', stockQty: '' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('products');

  return (
    <main className="container">
      <div className="page-head">
        <h1>Admin dashboard</h1>
        <p>Manage the product catalog and track orders across all buyers.</p>
      </div>

      <div className="tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          Manage products
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          All orders
        </button>
      </div>

      {tab === 'products' ? <ProductManager /> : <OrderManager />}
    </main>
  );
}

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data } = await client.get('/products');
      setProducts(data);
    } catch (err) {
      setError('Could not load products.');
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      unitPrice: product.unit_price,
      stockQty: product.stock_qty,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      unitPrice: Number(form.unitPrice),
      stockQty: Number(form.stockQty),
    };

    try {
      if (editingId) {
        await client.put(`/products/${editingId}`, payload);
        setMessage('Product updated.');
      } else {
        await client.post('/products', payload);
        setMessage('Product created.');
      }
      cancelEdit();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save product.');
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await client.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      setError('Could not remove product.');
    }
  }

  return (
    <div className="grid-2">
      <div>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Catalog ({products.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>${Number(p.unit_price).toFixed(2)}</td>
                  <td className={p.stock_qty > 10 ? 'stock-ok' : 'stock-low'}>{p.stock_qty}</td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn ghost small" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn ghost small" onClick={() => handleDelete(p.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
          {editingId ? `Edit product #${editingId}` : 'Add a new product'}
        </h2>

        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="sku">SKU</label>
            <input id="sku" value={form.sku} onChange={(e) => update('sku', e.target.value)} disabled={!!editingId} required />
          </div>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="unitPrice">Unit price ($)</label>
            <input id="unitPrice" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="stockQty">Stock quantity</label>
            <input id="stockQty" type="number" min="0" value={form.stockQty} onChange={(e) => update('stockQty', e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn primary" type="submit">{editingId ? 'Save changes' : 'Create product'}</button>
            {editingId && <button className="btn ghost" type="button" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const { data } = await client.get('/orders');
      setOrders(data);
    } catch (err) {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await client.patch(`/orders/${id}/status`, { status });
      loadOrders();
    } catch (err) {
      setError('Could not update order status.');
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      {orders.length === 0 ? (
        <div className="empty-state">No orders have been placed yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Buyer</th>
              <th>Placed on</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.buyer_name} <span style={{ color: 'var(--ink-soft)' }}>({o.company_name || '—'})</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>${Number(o.total_amount).toFixed(2)}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
