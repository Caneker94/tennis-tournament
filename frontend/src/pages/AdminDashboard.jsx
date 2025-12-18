import { Routes, Route, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import AdminUsers from '../components/admin/AdminUsers';
import AdminCategories from '../components/admin/AdminCategories';
import AdminGroups from '../components/admin/AdminGroups';
import AdminMatches from '../components/admin/AdminMatches';
import AdminSponsors from '../components/admin/AdminSponsors';
import AdminSchedule from '../components/admin/AdminSchedule';

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
            <Link to="/admin/schedule" className={isActive('/schedule') ? 'active' : ''}>
              Günlük Program
            </Link>
          </li>
          <li>
            <Link to="/admin/sponsors" className={isActive('/sponsors') ? 'active' : ''}>
              Katkı Sağlayanlar
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
        <Route path="/schedule" element={<AdminSchedule />} />
        <Route path="/sponsors" element={<AdminSponsors />} />
      </Routes>
    </div>
  );
}

function AdminHome() {
  const handleExportFixtures = async () => {
    try {
      const response = await api.get('/admin/export-fixtures', {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fikstur.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Fikstür indirilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="card">
      <h3>Hoş Geldiniz</h3>
      <p style={{ marginTop: '1rem' }}>
        Admin paneline hoş geldiniz. Yukarıdaki menüden işlem yapmak istediğiniz bölümü seçebilirsiniz.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Hızlı İşlemler</h4>
        <button
          className="btn btn-primary"
          onClick={handleExportFixtures}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>📥</span>
          Tüm Fikstürü Excel Olarak İndir
        </button>
        <p style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          Tüm kategorilerin maç programını CSV (Excel) formatında indirebilirsiniz.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
