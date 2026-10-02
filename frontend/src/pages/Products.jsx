import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
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
      setError('Could not load the catalog.');
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId) {
    setError('');
    setMessage('');
    const qty = Number(quantities[productId]) || 1;
    try {
      await client.post('/cart', { productId, quantity: qty });
      setMessage('Added to cart.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add to cart.');
    }
  }

  if (loading) return <main className="container">Loading catalog…</main>;

  return (
    <main className="container">
      <div className="page-head">
        <h1>Product catalog</h1>
        <p>Browse available stock and add items to your cart before checking out.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      {products.length === 0 ? (
        <div className="empty-state">No products are available right now.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Unit price</th>
              <th>In stock</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{p.sku}</td>
                <td>
                  <strong>{p.name}</strong>
                  {p.description && <div style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>{p.description}</div>}
                </td>
                <td>${Number(p.unit_price).toFixed(2)}</td>
                <td className={p.stock_qty > 0 ? 'stock-ok' : 'stock-low'}>
                  {p.stock_qty > 0 ? `${p.stock_qty} units` : 'Out of stock'}
                </td>
                <td>
                  <input
                    className="qty-input"
                    type="number"
                    min="1"
                    max={p.stock_qty}
                    disabled={p.stock_qty === 0}
                    value={quantities[p.id] || 1}
                    onChange={(e) => setQuantities((q) => ({ ...q, [p.id]: e.target.value }))}
                  />
                </td>
                <td>
                  <button className="btn small primary" disabled={p.stock_qty === 0} onClick={() => addToCart(p.id)}>
                    Add to cart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
