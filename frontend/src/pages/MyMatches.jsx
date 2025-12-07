import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

function ScheduleModal({ scheduleMatch, scheduleData, setScheduleData, submitSchedule, setScheduleMatch, getDateRangeForMatch, venues, user }) {
  const dateRange = getDateRangeForMatch(scheduleMatch);
  const isPlayer1 = scheduleMatch.player1_id === user.id;
  const opponentName = isPlayer1 ? scheduleMatch.player2_name : scheduleMatch.player1_name;
  const opponentPhone = isPlayer1 ? scheduleMatch.player2_phone : scheduleMatch.player1_phone;

  return (
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
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <h3 style={{ marginBottom: '1rem' }}>Maç Tarih ve Tesis Planla</h3>
        <p style={{ marginBottom: '0.5rem' }}>
          {scheduleMatch.player1_name} vs {scheduleMatch.player2_name}
        </p>
        {opponentPhone && (
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
            Rakip: {opponentName} - Tel: {opponentPhone}
          </p>
        )}
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
          Bu maç <strong>Dönem {dateRange.periodNumber}</strong> içinde planlanmalıdır<br />
          <strong>{dateRange.periodLabel}</strong> tarihleri arası
        </p>

        <form onSubmit={submitSchedule}>
          <div className="form-group">
            <label>Maç Tarihi</label>
            <input
              type="date"
              value={scheduleData.match_date}
              onChange={(e) => setScheduleData({ ...scheduleData, match_date: e.target.value })}
              min={dateRange.min}
              max={dateRange.max}
              required
            />
          </div>

          <div className="form-group">
            <label>Tesis</label>
            <select
              value={scheduleData.venue}
              onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })}
              required
            >
              <option value="">Tesis Seçiniz</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Planla
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setScheduleMatch(null)}
              style={{ flex: 1 }}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scheduleMatch, setScheduleMatch] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    match_date: '',
    venue: ''
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
  const { user } = useAuth();

  const venues = ['Unisport', 'Aslanlar', 'Podyum', 'Park Akademi', 'Evrensel', 'Yenigün'];

  useEffect(() => {
    loadMyMatches();
  }, []);

  async function loadMyMatches() {
    try {
      const response = await api.get('/matches/my-matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleScheduleMatch(match) {
    setScheduleMatch(match);
    setScheduleData({
      match_date: match.match_date ? match.match_date.split('T')[0] : '',
      venue: match.venue || ''
    });
    setError('');
    setSuccess('');
  }

  function getWeekLabel(weekNumber) {
    const labels = {
      1: 'Hafta 1-2',
      2: 'Hafta 3-4',
      3: 'Hafta 5-6',
      4: 'Hafta 7'
    };
    return labels[weekNumber] || `Hafta ${weekNumber}`;
  }

  function getDateRangeForMatch(match) {
    const tournamentStart = new Date('2025-12-15');

    // Dönem belirleme (match.week_number artık dönem numarası: 1, 2, 3, 4)
    let periodStart, periodEnd;
    const periodNumber = match.week_number;

    if (periodNumber === 1) {
      // Dönem 1: Hafta 1-2
      periodStart = new Date(tournamentStart);
      periodEnd = new Date(tournamentStart);
      periodEnd.setDate(tournamentStart.getDate() + 13); // 2 hafta
    } else if (periodNumber === 2) {
      // Dönem 2: Hafta 3-4
      periodStart = new Date(tournamentStart);
      periodStart.setDate(tournamentStart.getDate() + 14);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13); // 2 hafta
    } else if (periodNumber === 3) {
      // Dönem 3: Hafta 5-6
      periodStart = new Date(tournamentStart);
      periodStart.setDate(tournamentStart.getDate() + 28);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13); // 2 hafta
    } else {
      // Dönem 4: Hafta 7 (1 hafta)
      periodStart = new Date(tournamentStart);
      periodStart.setDate(tournamentStart.getDate() + 42);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6); // 1 hafta
    }

    return {
      min: periodStart.toISOString().split('T')[0],
      max: periodEnd.toISOString().split('T')[0],
      minDateFormatted: periodStart.toLocaleDateString('tr-TR'),
      maxDateFormatted: periodEnd.toLocaleDateString('tr-TR'),
      periodLabel: `${periodStart.toLocaleDateString('tr-TR')} - ${periodEnd.toLocaleDateString('tr-TR')}`,
      periodNumber: periodNumber
    };
  }

  async function submitSchedule(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/matches/${scheduleMatch.id}/schedule`, scheduleData);
      setSuccess('Maç tarihi ve tesisi başarıyla planlandı!');
      setScheduleMatch(null);
      loadMyMatches();
    } catch (error) {
      setError(error.response?.data?.error || 'Maç planlanamadı');
    }
  }

  function handleScoreSubmit(match) {
    setSelectedMatch(match);
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
    setError('');
    setSuccess('');
  }

  async function submitScore(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/matches/${selectedMatch.id}/score`, scoreData);
      setSuccess(response.data.message || 'Skor başarıyla kaydedildi!');
      setSelectedMatch(null);
      loadMyMatches();
    } catch (error) {
      setError(error.response?.data?.error || 'Skor kaydedilemedi');
    }
  }

  async function approveScore(matchId) {
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/matches/${matchId}/score/approve`);
      setSuccess(response.data.message || 'Skor onaylandı!');
      loadMyMatches();
    } catch (error) {
      setError(error.response?.data?.error || 'Skor onaylanamadı');
    }
  }

  function getMatchResult(match) {
    const isPlayer1 = match.player1_id === user.id;
    
    if (match.status === 'walkover') {
      // Walkover durumunda, maça çıkmayan kişi kaybeder
      if (match.walkover_player_id === user.id) {
        return { text: 'Mağlup', color: '#ef4444', bgColor: '#fee2e2' }; // Kırmızı
      } else {
        return { text: 'Galip', color: '#22c55e', bgColor: '#dcfce7' }; // Yeşil
      }
    }
    
    if (!match.winner_id) {
      return null; // Henüz skor girilmemiş
    }
    
    if (match.winner_id === user.id) {
      return { text: 'Galip', color: '#22c55e', bgColor: '#dcfce7' }; // Yeşil
    } else if (match.winner_id === -1) {
      return { text: 'Berabere', color: '#f59e0b', bgColor: '#fef3c7' }; // Sarı
    } else {
      return { text: 'Mağlup', color: '#ef4444', bgColor: '#fee2e2' }; // Kırmızı
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Maçlarım</h2>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      {matches.length === 0 ? (
        <div className="card">
          <p>Henüz maçınız bulunmamaktadır.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Hafta</th>
              <th>Tarih</th>
              <th>Tesis</th>
              <th>Rakip</th>
              <th>Telefon</th>
              <th>Grup</th>
              <th>Kategori</th>
              <th>Skor</th>
              <th>Sonuç</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const isPlayer1 = match.player1_id === user.id;
              const opponentName = isPlayer1 ? match.player2_name : match.player1_name;
              const opponentPhone = isPlayer1 ? match.player2_phone : match.player1_phone;
              const hasScore = match.player1_set1 !== null;
              const result = getMatchResult(match);
              const dateRange = getDateRangeForMatch(match);

              return (
                <tr key={match.id}>
                  <td>{getWeekLabel(match.week_number)}</td>
                  <td>
                    {match.venue ? (
                      <div>
                        <div style={{ fontWeight: '600', color: '#059669' }}>
                          {new Date(match.match_date).toLocaleDateString('tr-TR')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          ({dateRange.periodLabel})
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {dateRange.periodLabel}
                      </div>
                    )}
                  </td>
                  <td>{match.venue || '-'}</td>
                  <td>{opponentName}</td>
                  <td>{opponentPhone || '-'}</td>
                  <td>{match.group_name}</td>
                  <td>{match.gender === 'male' ? 'Erkek' : 'Kadın'} - {match.category_name}</td>
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
                    {result ? (
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '0.375rem',
                        backgroundColor: result.bgColor,
                        color: result.color,
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {result.text}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {match.status === 'walkover' ? (
                      'Walkover'
                    ) : hasScore ? (
                      match.approval_status === 'pending' ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#fef3c7',
                          color: '#f59e0b',
                          fontWeight: '500',
                          fontSize: '0.875rem'
                        }}>
                          {match.submitted_by === user.id ? 'Onay Bekliyor' : 'Onay Gerekli'}
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#d1fae5',
                          color: '#059669',
                          fontWeight: '500',
                          fontSize: '0.875rem'
                        }}>
                          Onaylandı
                        </span>
                      )
                    ) : (
                      'Planlandı'
                    )}
                  </td>
                  <td>
                    {hasScore && match.approval_status === 'pending' && (match.submitted_by !== user.id || user.role === 'admin') ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => approveScore(match.id)}
                      >
                        Skoru Onayla
                      </button>
                    ) : !hasScore && match.status !== 'walkover' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleScheduleMatch(match)}
                        >
                          Tarih Planla
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleScoreSubmit(match)}
                        >
                          Skor Gir
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

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
            padding: '1rem'
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem' }}>Skor Gir</h3>
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

      {scheduleMatch && (
        <ScheduleModal
          scheduleMatch={scheduleMatch}
          scheduleData={scheduleData}
          setScheduleData={setScheduleData}
          submitSchedule={submitSchedule}
          setScheduleMatch={setScheduleMatch}
          getDateRangeForMatch={getDateRangeForMatch}
          venues={venues}
          user={user}
        />
      )}
    </div>
  );
}

export default MyMatches;