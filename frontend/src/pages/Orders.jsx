import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/orders')
      .then(({ data }) => setOrders(data))
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container">Loading orders…</main>;

  return (
    <main className="container">
      <div className="page-head">
        <h1>My orders</h1>
        <p>Track order status and view invoices for past purchases.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">You haven't placed any orders yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Placed on</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td><span className={`tag ${o.status}`}>{o.status}</span></td>
                <td>${Number(o.total_amount).toFixed(2)}</td>
                <td><Link to={`/orders/${o.id}`}>View details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
