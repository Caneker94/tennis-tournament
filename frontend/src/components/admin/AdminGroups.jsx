import { useState, useEffect } from 'react';
import api from '../../utils/api';

function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    name: ''
  });
  const [playerFormData, setPlayerFormData] = useState({
    user_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGroupName, setFilterGroupName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [groupsRes, categoriesRes, usersRes] = await Promise.all([
        api.get('/admin/groups'),
        api.get('/admin/categories'),
        api.get('/admin/users')
      ]);
      setGroups(groupsRes.data);
      setCategories(categoriesRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'player'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/groups', formData);
      setSuccess('Grup başarıyla oluşturuldu!');
      setShowForm(false);
      setFormData({ category_id: '', name: '' });
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Grup oluşturulamadı');
    }
  }

  async function handleAddPlayer(groupId) {
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/groups/${groupId}/players`, playerFormData);
      setSuccess('Oyuncu gruba eklendi!');
      setPlayerFormData({ user_id: '' });
      loadGroupPlayers(groupId);
    } catch (error) {
      setError(error.response?.data?.error || 'Oyuncu eklenemedi');
    }
  }

  async function loadGroupPlayers(groupId) {
    try {
      const response = await api.get(`/admin/groups/${groupId}/players`);
      const updatedGroups = groups.map(g =>
        g.id === groupId ? { ...g, players: response.data } : g
      );
      setGroups(updatedGroups);

      // Update selectedGroup if it's the same group
      if (selectedGroup && selectedGroup.id === groupId) {
        const updatedGroup = updatedGroups.find(g => g.id === groupId);
        setSelectedGroup(updatedGroup);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to load group players:', error);
      return [];
    }
  }

  async function handleRemovePlayer(groupId, userId) {
    if (!confirm('Bu oyuncuyu gruptan çıkarmak istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/admin/groups/${groupId}/players/${userId}`);
      setSuccess('Oyuncu gruptan çıkarıldı!');
      await loadGroupPlayers(groupId);
    } catch (error) {
      setError('Oyuncu çıkarılamadı');
    }
  }

  async function showGroupDetails(group) {
    // Load players first
    const players = await loadGroupPlayers(group.id);
    // Then set the selected group with players included
    setSelectedGroup({ ...group, players });
  }

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesCategory = !filterCategory || group.category_id === parseInt(filterCategory);
    const matchesGroupName = !filterGroupName || group.name.toLowerCase().includes(filterGroupName.toLowerCase());
    return matchesCategory && matchesGroupName;
  });

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Grup Yönetimi</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Grup'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Filtrele</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Tümü</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.gender === 'male' ? 'Erkek' : 'Kadın'} - {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Grup Adı</label>
            <input
              type="text"
              value={filterGroupName}
              onChange={(e) => setFilterGroupName(e.target.value)}
              placeholder="Grup ara..."
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Yeni Grup Oluştur</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Kategori</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="">Seçiniz</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.gender === 'male' ? 'Erkek' : 'Kadın'} - {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Grup Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Grup A, Grup B, vb."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Oluştur</button>
          </form>
        </div>
      )}

      <div className="card">
        <h4 style={{ marginBottom: '1rem' }}>
          Mevcut Gruplar ({filteredGroups.length} / {groups.length})
        </h4>
        {groups.length === 0 ? (
          <p>Henüz grup oluşturulmamış.</p>
        ) : filteredGroups.length === 0 ? (
          <p>Filtreye uygun grup bulunamadı.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Grup Adı</th>
                <th>Kategori</th>
                <th>Cinsiyet</th>
                <th>Oyuncu Sayısı</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id}>
                  <td>{group.id}</td>
                  <td>{group.name}</td>
                  <td>{group.category_name}</td>
                  <td>{group.gender === 'male' ? 'Erkek' : 'Kadın'}</td>
                  <td>{group.player_count || 0} / 8</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => showGroupDetails(group)}
                      style={{ fontSize: '0.875rem' }}
                    >
                      Oyuncular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedGroup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 style={{ marginBottom: '1rem' }}>
              {selectedGroup.name} - Oyuncular
            </h4>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Oyuncu Ekle (Max 8)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={playerFormData.user_id}
                  onChange={(e) => setPlayerFormData({ user_id: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Oyuncu Seçiniz</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddPlayer(selectedGroup.id)}
                  disabled={!playerFormData.user_id}
                >
                  Ekle
                </button>
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Oyuncu</th>
                  <th>Kullanıcı Adı</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {selectedGroup.players && selectedGroup.players.length > 0 ? (
                  selectedGroup.players.map((player, index) => (
                    <tr key={player.id}>
                      <td>{index + 1}</td>
                      <td>{player.full_name}</td>
                      <td>{player.username}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemovePlayer(selectedGroup.id, player.id)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Çıkar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      Henüz oyuncu eklenmemiş
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              className="btn btn-outline"
              onClick={() => setSelectedGroup(null)}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminGroups;
