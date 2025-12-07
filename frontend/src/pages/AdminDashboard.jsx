import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminUsers from '../components/admin/AdminUsers';
import AdminCategories from '../components/admin/AdminCategories';
import AdminGroups from '../components/admin/AdminGroups';
import AdminMatches from '../components/admin/AdminMatches';
import AdminSponsors from '../components/admin/AdminSponsors';

function AdminDashboard() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === `/admin${path}`;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Admin Paneli</h2>

      <nav className="admin-nav">
        <ul>
          <li>
            <Link to="/admin/users" className={isActive('/users') ? 'active' : ''}>
              Kullanıcılar
            </Link>
          </li>
          <li>
            <Link to="/admin/categories" className={isActive('/categories') ? 'active' : ''}>
              Kategoriler
            </Link>
          </li>
          <li>
            <Link to="/admin/groups" className={isActive('/groups') ? 'active' : ''}>
              Gruplar
            </Link>
          </li>
          <li>
            <Link to="/admin/matches" className={isActive('/matches') ? 'active' : ''}>
              Maç Programı
            </Link>
          </li>
          <li>
            <Link to="/admin/sponsors" className={isActive('/sponsors') ? 'active' : ''}>
              Sponsorlar
            </Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/categories" element={<AdminCategories />} />
        <Route path="/groups" element={<AdminGroups />} />
        <Route path="/matches" element={<AdminMatches />} />
        <Route path="/sponsors" element={<AdminSponsors />} />
      </Routes>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="card">
      <h3>Hoş Geldiniz</h3>
      <p style={{ marginTop: '1rem' }}>
        Admin paneline hoş geldiniz. Yukarıdaki menüden işlem yapmak istediğiniz bölümü seçebilirsiniz.
      </p>
    </div>
  );
}

export default AdminDashboard;
