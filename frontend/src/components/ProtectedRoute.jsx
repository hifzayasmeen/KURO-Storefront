import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps a page and redirects to /login if not authenticated, or to a
// safe default if the user's role doesn't match what the route needs.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : '/products';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
