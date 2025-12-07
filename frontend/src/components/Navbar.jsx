import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>GMB ENDUSTRI BURSA OPEN</h1>
        <div className="nav-links">
          <Link to="/">Ana Sayfa</Link>
          <Link to="/standings">Puan Durumu</Link>
          <Link to="/schedule">Maç Programı</Link>
          {user ? (
            <>
              {user.role === 'player' && <Link to="/my-matches">Maçlarım</Link>}
              {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
              <span>Hoşgeldin, {user.full_name}</span>
              <button onClick={logout} className="btn btn-outline">
                Çıkış
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
