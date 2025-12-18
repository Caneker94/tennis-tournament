import { useState, useEffect } from 'react';
import api from '../../utils/api';

function AdminSchedule() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingMatch, setEditingMatch] = useState(null);
  const [editData, setEditData] = useState({
    venue: '',
    match_date: '',
    match_time: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const venues = [
    'Unisport',
    'Aslanlar',
    'Podyum',
    'Park Akademi',
    'Evrensel',
    'Yenigün',
    'Gd Sport Academy',
    'Esas',
    'Meşelipark',
    'Gümüş Raket',
    'Altınşehir',
    'Şahinkaya',
    'Diğer'
  ];

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const response = await api.get('/admin/all-matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEditMatch(match) {
    setEditingMatch(match);
    setEditData({
      venue: match.venue || '',
      match_date: match.match_date,
      match_time: match.match_time || ''
    });
    setError('');
    setSuccess('');
  }

  async function submitMatchEdit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/admin/matches/${editingMatch.id}`, editData);
      setSuccess('Maç bilgileri güncellendi!');
      setEditingMatch(null);
      loadMatches();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Maç güncellenemedi');
    }
  }

  // Get unique dates from matches
  const dates = [...new Set(matches.map(m => m.match_date).filter(Boolean))].sort();

  // Get unique categories
  const categories = [...new Set(matches.map(m => m.category_name))].sort();

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const dateMatch = !selectedDate || match.match_date === selectedDate;
    const categoryMatch = !selectedCategory || match.category_name === selectedCategory;
    return dateMatch && categoryMatch;
  });

  // Group matches by date
  const matchesByDate = {};
  filteredMatches.forEach(match => {
    const date = match.match_date || 'Tarih Planlanmamış';
    if (!matchesByDate[date]) {
      matchesByDate[date] = [];
    }
    matchesByDate[date].push(match);
  });

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem' }}>Günlük Maç Programı</h3>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Filtrele</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tarih</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">Tüm Tarihler</option>
              {dates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matches by Date */}
      {Object.keys(matchesByDate).length === 0 ? (
        <div className="card">
          <p>Seçilen filtrelere uygun maç bulunamadı.</p>
        </div>
      ) : (
        Object.keys(matchesByDate).sort().map(date => (
          <div key={date} className="card" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#059669' }}>
              {date === 'Tarih Planlanmamış' ? date : (
                <>
                  {new Date(date).toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    ({matchesByDate[date].length} maç)
                  </span>
                </>
              )}
            </h4>

            <table className="table">
              <thead>
                <tr>
                  <th>Saat</th>
                  <th>Kategori</th>
                  <th>Grup</th>
                  <th>Oyuncular</th>
                  <th>Tesis</th>
                  <th>Durum</th>
                  <th>Skor</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {matchesByDate[date].map(match => (
                  <tr key={match.id}>
                    <td>{match.match_time || '-'}</td>
                    <td>{match.category_name}</td>
                    <td>{match.group_name}</td>
                    <td>
                      {match.is_doubles ? (
                        <div style={{ fontSize: '0.875rem' }}>
                          <div>{match.player1_name} / {match.player1_partner_name}</div>
                          <div style={{ color: '#6b7280' }}>vs</div>
                          <div>{match.player2_name} / {match.player2_partner_name}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.875rem' }}>
                          {match.player1_name} vs {match.player2_name}
                        </div>
                      )}
                    </td>
                    <td>{match.venue || '-'}</td>
                    <td>
                      {match.status === 'completed' ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#d1fae5',
                          color: '#059669',
                          fontSize: '0.875rem'
                        }}>
                          Tamamlandı
                        </span>
                      ) : match.status === 'walkover' ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          fontSize: '0.875rem'
                        }}>
                          Walkover
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#fef3c7',
                          color: '#f59e0b',
                          fontSize: '0.875rem'
                        }}>
                          Planlandı
                        </span>
                      )}
                    </td>
                    <td>
                      {match.player1_set1 !== null ? (
                        <div style={{ fontSize: '0.875rem' }}>
                          {match.player1_set1}-{match.player2_set1}, {match.player1_set2}-{match.player2_set2}
                          {match.super_tiebreak_p1 !== null && (
                            <> (ST: {match.super_tiebreak_p1}-{match.super_tiebreak_p2})</>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEditMatch(match)}
                        style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                      >
                        Planla
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
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
            <h3 style={{ marginBottom: '1rem' }}>Maç Tarih ve Tesis Planla</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {editingMatch.is_doubles ? (
                <>
                  {editingMatch.player1_name} / {editingMatch.player1_partner_name}<br />
                  vs<br />
                  {editingMatch.player2_name} / {editingMatch.player2_partner_name}
                </>
              ) : (
                <>
                  {editingMatch.player1_name} vs {editingMatch.player2_name}
                </>
              )}
            </p>

            <form onSubmit={submitMatchEdit}>
              <div className="form-group">
                <label>Maç Tarihi</label>
                <input
                  type="date"
                  value={editData.match_date}
                  onChange={(e) => setEditData({ ...editData, match_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Maç Saati</label>
                <input
                  type="time"
                  value={editData.match_time}
                  onChange={(e) => setEditData({ ...editData, match_time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tesis</label>
                <select
                  value={editData.venue}
                  onChange={(e) => setEditData({ ...editData, venue: e.target.value })}
                  required
                >
                  <option value="">Tesis Seçiniz</option>
                  {venues.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Planla
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingMatch(null)}
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

export default AdminSchedule;
