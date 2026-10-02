import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <div className="brand">
        ARROW<span>STACK</span>
      </div>
      {user && (
        <nav>
          {user.role === 'buyer' && (
            <>
              <NavLink to="/products">Catalog</NavLink>
              <NavLink to="/cart">Cart</NavLink>
              <NavLink to="/orders">My Orders</NavLink>
            </>
          )}
          {user.role === 'admin' && <NavLink to="/admin">Admin Dashboard</NavLink>}
          <span className="who">{user.name} · {user.role}</span>
          <button onClick={handleLogout}>Log out</button>
        </nav>
      )}
    </header>
  );
}
