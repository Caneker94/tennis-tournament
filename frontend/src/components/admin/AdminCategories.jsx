import { useState, useEffect } from 'react';
import api from '../../utils/api';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/categories', formData);
      setSuccess('Kategori başarıyla oluşturuldu!');
      setShowForm(false);
      setFormData({ name: '', gender: 'male' });
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Kategori oluşturulamadı');
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Kategori Yönetimi</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Kategori'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Yeni Kategori Oluştur</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Kategori Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Elite, Master, Rising"
                required
              />
            </div>
            <div className="form-group">
              <label>Cinsiyet</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Oluştur</button>
          </form>
        </div>
      )}

      <div className="card">
        <h4 style={{ marginBottom: '1rem' }}>Mevcut Kategoriler</h4>
        {categories.length === 0 ? (
          <p>Henüz kategori oluşturulmamış.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kategori Adı</th>
                <th>Cinsiyet</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.gender === 'male' ? 'Erkek' : 'Kadın'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#fffbeb' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>Öneri: Standart Kategoriler</h4>
        <p style={{ fontSize: '0.875rem' }}>
          <strong>Erkekler:</strong> Elite, Master, Rising<br />
          <strong>Kadınlar:</strong> Master, Rising
        </p>
      </div>
    </div>
  );
}

export default AdminCategories;
