import { useState, useEffect } from 'react';
import api from '../../utils/api';

function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [groupPlayers, setGroupPlayers] = useState([]);
  const [formData, setFormData] = useState({
    group_id: '',
    player1_id: '',
    player2_id: '',
    match_date: '',
    week_number: 1
  });
  const [scoreData, setScoreData] = useState({
    player1_set1: '',
    player2_set1: '',
    player1_set2: '',
    player2_set2: '',
    super_tiebreak_p1: '',
    super_tiebreak_p2: '',
    is_walkover: false,
    walkover_player_id: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadData();
    loadCategories();
  }, [filterWeek, filterCategory]);

  useEffect(() => {
    if (formData.group_id) {
      loadGroupPlayers(formData.group_id);
    }
  }, [formData.group_id]);

  async function loadData() {
    try {
      const params = {};
      if (filterWeek) params.week = filterWeek;
      if (filterCategory) params.category_id = filterCategory;

      const [matchesRes, groupsRes] = await Promise.all([
        api.get('/matches', { params }),
        api.get('/admin/groups')
      ]);
      
      setMatches(matchesRes.data);
      setGroups(groupsRes.data);

      // Extract unique weeks
      const uniqueWeeks = [...new Set(matchesRes.data.map(m => m.week_number))].sort((a, b) => a - b);
      setWeeks(uniqueWeeks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async function loadGroupPlayers(groupId) {
    try {
      const response = await api.get(`/admin/groups/${groupId}/players`);
      setGroupPlayers(response.data);
    } catch (error) {
      console.error('Failed to load group players:', error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.player1_id === formData.player2_id) {
      setError('Bir oyuncu kendisiyle eşleştirilemez!');
      return;
    }

    try {
      await api.post('/admin/matches', formData);
      setSuccess('Maç başarıyla oluşturuldu!');
      setShowForm(false);
      setFormData({
        group_id: '',
        player1_id: '',
        player2_id: '',
        match_date: '',
        week_number: 1
      });
      setGroupPlayers([]);
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Maç oluşturulamadı');
    }
  }

  function handleEditScore(match) {
    setSelectedMatch(match);
    
    // Eğer skor varsa, mevcut değerleri doldur
    if (match.player1_set1 !== null) {
      setScoreData({
        player1_set1: match.player1_set1 || '',
        player2_set1: match.player2_set1 || '',
        player1_set2: match.player1_set2 || '',
        player2_set2: match.player2_set2 || '',
        super_tiebreak_p1: match.super_tiebreak_p1 || '',
        super_tiebreak_p2: match.super_tiebreak_p2 || '',
        is_walkover: match.status === 'walkover',
        walkover_player_id: match.walkover_player_id || null
      });
    } else {
      // Yeni skor girişi
      setScoreData({
        player1_set1: '',
        player2_set1: '',
        player1_set2: '',
        player2_set2: '',
        super_tiebreak_p1: '',
        super_tiebreak_p2: '',
        is_walkover: false,
        walkover_player_id: null
      });
    }
    
    setError('');
    setSuccess('');
  }

  async function submitScore(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Admin olarak skor güncelleme endpoint'i
      await api.put(`/admin/matches/${selectedMatch.id}/score`, scoreData);
      setSuccess('Skor başarıyla güncellendi!');
      setSelectedMatch(null);
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Skor güncellenemedi');
    }
  }

  async function handleDeleteMatch(matchId) {
    if (!window.confirm('Bu maçı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/admin/matches/${matchId}`);
      setSuccess('Maç başarıyla silindi!');
      loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Maç silinemedi');
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Maç Programı Yönetimi</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Maç Ekle'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Yeni Maç Oluştur</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Grup</label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value, player1_id: '', player2_id: '' })}
                required
              >
                <option value="">Seçiniz</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.gender === 'male' ? 'Erkek' : 'Kadın'} - {group.category_name} - {group.name}
                  </option>
                ))}
              </select>
            </div>

            {groupPlayers.length > 0 && (
              <>
                <div className="form-group">
                  <label>Oyuncu 1</label>
                  <select
                    value={formData.player1_id}
                    onChange={(e) => setFormData({ ...formData, player1_id: e.target.value })}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {groupPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Oyuncu 2</label>
                  <select
                    value={formData.player2_id}
                    onChange={(e) => setFormData({ ...formData, player2_id: e.target.value })}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {groupPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Maç Tarihi</label>
              <input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Hafta</label>
              <input
                type="number"
                min="1"
                value={formData.week_number}
                onChange={(e) => setFormData({ ...formData, week_number: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">Oluştur</button>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Hafta Filtrele</label>
            <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
              <option value="">Tüm Haftalar</option>
              {weeks.map(week => (
                <option key={week} value={week}>Hafta {week}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Kategori Filtrele</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.gender === 'male' ? 'Erkek' : 'Kadın'} - {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ marginBottom: '1rem' }}>Tüm Maçlar</h4>
        {matches.length === 0 ? (
          <p>Henüz maç bulunmamaktadır.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Hafta</th>
                  <th>Tesis</th>
                  <th>Kategori</th>
                  <th>Grup</th>
                  <th>Oyuncu 1</th>
                  <th>Oyuncu 2</th>
                  <th>Skor</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const hasScore = match.player1_set1 !== null;
                  
                  return (
                    <tr key={match.id}>
                      <td>{new Date(match.match_date).toLocaleDateString('tr-TR')}</td>
                      <td>{match.week_number}</td>
                      <td>{match.venue || '-'}</td>
                      <td>{match.gender === 'male' ? 'Erkek' : 'Kadın'} - {match.category_name}</td>
                      <td>{match.group_name}</td>
                      <td>{match.player1_name}</td>
                      <td>{match.player2_name}</td>
                      <td>
                        {hasScore ? (
                          <>
                            {match.player1_set1}-{match.player2_set1}, {match.player1_set2}-{match.player2_set2}
                            {match.super_tiebreak_p1 !== null && ` (ST: ${match.super_tiebreak_p1}-${match.super_tiebreak_p2})`}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {match.status === 'walkover' ? (
                          <span style={{ color: '#ef4444' }}>Walkover</span>
                        ) : hasScore ? (
                          <span style={{ color: '#22c55e' }}>Tamamlandı</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>Planlandı</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEditScore(match)}
                            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                          >
                            {hasScore ? 'Düzenle' : 'Skor Gir'}
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleDeleteMatch(match.id)}
                            style={{ 
                              fontSize: '0.875rem', 
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#ef4444',
                              color: 'white'
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMatch && (
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
            zIndex: 1000
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {selectedMatch.player1_set1 !== null ? 'Skor Düzenle' : 'Skor Gir'}
            </h3>
            <p style={{ marginBottom: '1rem' }}>
              {selectedMatch.player1_name} vs {selectedMatch.player2_name}
            </p>

            <form onSubmit={submitScore}>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={scoreData.is_walkover}
                    onChange={(e) => setScoreData({
                      ...scoreData,
                      is_walkover: e.target.checked,
                      walkover_player_id: e.target.checked ? selectedMatch.player1_id : null
                    })}
                  />
                  {' '}Walkover (Maça çıkmama)
                </label>
              </div>

              {scoreData.is_walkover ? (
                <div className="form-group">
                  <label>Maça çıkmayan oyuncu</label>
                  <select
                    value={scoreData.walkover_player_id || ''}
                    onChange={(e) => setScoreData({
                      ...scoreData,
                      walkover_player_id: parseInt(e.target.value)
                    })}
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value={selectedMatch.player1_id}>{selectedMatch.player1_name}</option>
                    <option value={selectedMatch.player2_id}>{selectedMatch.player2_name}</option>
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>1. Set</label>
                    <div className="score-input">
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player1_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.player1_set1}
                          onChange={(e) => setScoreData({ ...scoreData, player1_set1: e.target.value })}
                          required
                        />
                      </div>
                      <span>-</span>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player2_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.player2_set1}
                          onChange={(e) => setScoreData({ ...scoreData, player2_set1: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>2. Set</label>
                    <div className="score-input">
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player1_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.player1_set2}
                          onChange={(e) => setScoreData({ ...scoreData, player1_set2: e.target.value })}
                          required
                        />
                      </div>
                      <span>-</span>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player2_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.player2_set2}
                          onChange={(e) => setScoreData({ ...scoreData, player2_set2: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Süper Tie Break (isteğe bağlı)</label>
                    <div className="score-input">
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player1_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.super_tiebreak_p1}
                          onChange={(e) => setScoreData({ ...scoreData, super_tiebreak_p1: e.target.value })}
                        />
                      </div>
                      <span>-</span>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>{selectedMatch.player2_name}</label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.super_tiebreak_p2}
                          onChange={(e) => setScoreData({ ...scoreData, super_tiebreak_p2: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Kaydet
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedMatch(null)}
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMatches;