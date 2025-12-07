import { useState, useEffect } from 'react';
import api from '../../utils/api';

function AdminSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    link_url: '',
    display_order: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const response = await api.get('/admin/sponsors');
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingSponsor) {
        await api.put(`/admin/sponsors/${editingSponsor.id}`, {
          ...formData,
          active: editingSponsor.active
        });
        setSuccess('Sponsor güncellendi!');
      } else {
        await api.post('/admin/sponsors', formData);
        setSuccess('Sponsor eklendi!');
      }

      setShowForm(false);
      setEditingSponsor(null);
      setFormData({ name: '', logo_url: '', link_url: '', display_order: 0 });
      loadSponsors();
    } catch (error) {
      setError(error.response?.data?.error || 'İşlem başarısız');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu sponsoru silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/admin/sponsors/${id}`);
      setSuccess('Sponsor silindi!');
      loadSponsors();
    } catch (error) {
      setError('Sponsor silinemedi');
    }
  }

  async function toggleActive(sponsor) {
    try {
      await api.put(`/admin/sponsors/${sponsor.id}`, {
        ...sponsor,
        active: sponsor.active ? 0 : 1
      });
      setSuccess('Sponsor durumu güncellendi!');
      loadSponsors();
    } catch (error) {
      setError('Durum güncellenemedi');
    }
  }

  function handleEdit(sponsor) {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo_url: sponsor.logo_url,
      link_url: sponsor.link_url || '',
      display_order: sponsor.display_order
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingSponsor(null);
    setFormData({ name: '', logo_url: '', link_url: '', display_order: 0 });
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Sponsor Yönetimi</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Sponsor Ekle'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>
            {editingSponsor ? 'Sponsor Düzenle' : 'Yeni Sponsor Ekle'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Sponsor Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Logo URL</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                required
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Logo görselinin URL adresi
              </small>
            </div>

            <div className="form-group">
              <label>Web Site URL (İsteğe Bağlı)</label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://example.com"
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Logoya tıklandığında açılacak web sitesi
              </small>
            </div>

            <div className="form-group">
              <label>Sıralama (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Küçük sayılar önce gösterilir
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingSponsor ? 'Güncelle' : 'Ekle'}
              </button>
              <button type="button" className="btn btn-outline" onClick={cancelForm}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h4 style={{ marginBottom: '1rem' }}>Mevcut Sponsorlar</h4>
        {sponsors.length === 0 ? (
          <p>Henüz sponsor eklenmemiş.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sıra</th>
                <th>Logo</th>
                <th>Sponsor Adı</th>
                <th>Web Site</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td>{sponsor.display_order}</td>
                  <td>
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                    />
                  </td>
                  <td>{sponsor.name}</td>
                  <td>
                    {sponsor.link_url ? (
                      <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer">
                        Link
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        backgroundColor: sponsor.active ? '#d1fae5' : '#fee2e2',
                        color: sponsor.active ? '#065f46' : '#991b1b'
                      }}
                    >
                      {sponsor.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(sponsor)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => toggleActive(sponsor)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {sponsor.active ? 'Pasif Yap' : 'Aktif Yap'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(sponsor.id)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminSponsors;
