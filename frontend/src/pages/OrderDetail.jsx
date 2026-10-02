import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('Could not load this order.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="container">Loading order…</main>;
  if (error) return <main className="container"><div className="error-banner">{error}</div></main>;
  if (!order) return null;

  return (
    <main className="container">
      <div className="page-head">
        <h1>Order #{order.id}</h1>
        <p>
          Placed {new Date(order.created_at).toLocaleString()} · Status:{' '}
          <span className={`tag ${order.status}`}>{order.status}</span>
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Unit price</th>
            <th>Quantity</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td>${Number(item.unit_price).toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${Number(item.line_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.1rem' }}>
        <strong>Total: ${Number(order.total_amount).toFixed(2)}</strong>
      </div>

      {order.invoice && (
        <div className="panel" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.6rem' }}>Invoice</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            {order.invoice.invoice_number} · issued {new Date(order.invoice.issued_at).toLocaleDateString()} · $
            {Number(order.invoice.amount).toFixed(2)}
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/orders">&larr; Back to my orders</Link>
      </div>
    </main>
  );
}
