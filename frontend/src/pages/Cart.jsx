import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    try {
      const { data } = await client.get('/cart');
      setItems(data);
    } catch (err) {
      setError('Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(id, quantity) {
    if (quantity <= 0) return;
    try {
      await client.put(`/cart/${id}`, { quantity });
      loadCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update quantity.');
    }
  }

  async function removeItem(id) {
    try {
      await client.delete(`/cart/${id}`);
      loadCart();
    } catch (err) {
      setError('Could not remove item.');
    }
  }

  async function handleCheckout() {
    setError('');
    setCheckingOut(true);
    try {
      const { data } = await client.post('/cart/checkout');
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed.');
      if (err.response?.data?.shortages) {
        loadCart();
      }
    } finally {
      setCheckingOut(false);
    }
  }

  const total = items.reduce((sum, item) => sum + Number(item.line_total), 0);

  if (loading) return <main className="container">Loading cart…</main>;

  return (
    <main className="container">
      <div className="page-head">
        <h1>Your cart</h1>
        <p>Review quantities before placing your order.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">Your cart is empty. Add products from the catalog.</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit price</th>
                <th>Quantity</th>
                <th>Line total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>
                    <input
                      className="qty-input"
                      type="number"
                      min="1"
                      max={item.stock_qty}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    />
                  </td>
                  <td>${Number(item.line_total).toFixed(2)}</td>
                  <td>
                    <button className="btn ghost small" onClick={() => removeItem(item.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Total: ${total.toFixed(2)}</h2>
            <button className="btn primary" onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
