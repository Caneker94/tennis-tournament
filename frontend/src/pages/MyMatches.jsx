import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

function ScheduleModal({ scheduleMatch, scheduleData, setScheduleData, submitSchedule, setScheduleMatch, getDateRangeForMatch, venues, user }) {
  const dateRange = getDateRangeForMatch(scheduleMatch);
  const isPlayer1 = scheduleMatch.player1_id === user.id || scheduleMatch.player1_partner_id === user.id;

  let team1Name, team2Name, opponentName, opponentPhone;
  if (scheduleMatch.is_doubles) {
    team1Name = `${scheduleMatch.player1_name} / ${scheduleMatch.player1_partner_name}`;
    team2Name = `${scheduleMatch.player2_name} / ${scheduleMatch.player2_partner_name}`;
    opponentName = isPlayer1 ? team2Name : team1Name;
    // Combine both phone numbers for doubles
    if (isPlayer1) {
      const phone1 = scheduleMatch.player2_phone || '-';
      const phone2 = scheduleMatch.player2_partner_phone || '-';
      opponentPhone = `${phone1} / ${phone2}`;
    } else {
      const phone1 = scheduleMatch.player1_phone || '-';
      const phone2 = scheduleMatch.player1_partner_phone || '-';
      opponentPhone = `${phone1} / ${phone2}`;
    }
  } else {
    team1Name = scheduleMatch.player1_name;
    team2Name = scheduleMatch.player2_name;
    opponentName = isPlayer1 ? scheduleMatch.player2_name : scheduleMatch.player1_name;
    opponentPhone = isPlayer1 ? scheduleMatch.player2_phone : scheduleMatch.player1_phone;
  }

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
          {team1Name} vs {team2Name}
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
            <label>Maç Saati</label>
            <input
              type="time"
              value={scheduleData.match_time}
              onChange={(e) => setScheduleData({ ...scheduleData, match_time: e.target.value })}
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scheduleData, setScheduleData] = useState({
    match_date: '',
    match_time: '',
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
      match_time: match.match_time || '',
      venue: match.venue || ''
    });
    setError('');
    setSuccess('');
  }

  function getWeekLabel(weekNumber) {
    // Map actual week numbers (1-7) to period labels
    if (weekNumber === 1 || weekNumber === 2) {
      return 'Hafta 1-2';
    } else if (weekNumber === 3 || weekNumber === 4) {
      return 'Hafta 3-4';
    } else if (weekNumber === 5 || weekNumber === 6) {
      return 'Hafta 5-6';
    } else if (weekNumber === 7) {
      return 'Hafta 7';
    }
    return `Hafta ${weekNumber}`;
  }

  function getDateRangeForMatch(match) {
    const tournamentStart = new Date('2025-12-15');

    // Hafta numarasını (1-7) döneme (1-4) çevir
    let periodNumber;
    const weekNumber = match.week_number;
    if (weekNumber === 1 || weekNumber === 2) {
      periodNumber = 1;
    } else if (weekNumber === 3 || weekNumber === 4) {
      periodNumber = 2;
    } else if (weekNumber === 5 || weekNumber === 6) {
      periodNumber = 3;
    } else {
      periodNumber = 4;
    }

    let periodStart, periodEnd;

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

  // Get unique categories from matches
  const categories = [...new Set(matches.map(m => m.category_name))].sort();

  // Filter matches by selected category
  const filteredMatches = selectedCategory
    ? matches.filter(m => m.category_name === selectedCategory)
    : matches;

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Maçlarım</h2>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      {/* Category Filter */}
      {matches.length > 0 && categories.length > 1 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ marginRight: '0.5rem' }}>Kategori:</strong>
            <button
              className={selectedCategory === '' ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => setSelectedCategory('')}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Tümü ({matches.length})
            </button>
            {categories.map(category => {
              const count = matches.filter(m => m.category_name === category).length;
              return (
                <button
                  key={category}
                  className={selectedCategory === category ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => setSelectedCategory(category)}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="card">
          <p>{selectedCategory ? `${selectedCategory} kategorisinde maçınız bulunmamaktadır.` : 'Henüz maçınız bulunmamaktadır.'}</p>
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
            {filteredMatches.map((match) => {
              const isPlayer1 = match.player1_id === user.id || match.player1_partner_id === user.id;

              // For doubles matches, show team names
              let myTeamName, opponentTeamName, opponentPhone;
              if (match.is_doubles) {
                if (isPlayer1) {
                  myTeamName = `${match.player1_name} / ${match.player1_partner_name}`;
                  opponentTeamName = `${match.player2_name} / ${match.player2_partner_name}`;
                  // Combine both phone numbers for doubles
                  const phone1 = match.player2_phone || '-';
                  const phone2 = match.player2_partner_phone || '-';
                  opponentPhone = `${phone1} / ${phone2}`;
                } else {
                  myTeamName = `${match.player2_name} / ${match.player2_partner_name}`;
                  opponentTeamName = `${match.player1_name} / ${match.player1_partner_name}`;
                  // Combine both phone numbers for doubles
                  const phone1 = match.player1_phone || '-';
                  const phone2 = match.player1_partner_phone || '-';
                  opponentPhone = `${phone1} / ${phone2}`;
                }
              } else {
                const opponentName = isPlayer1 ? match.player2_name : match.player1_name;
                myTeamName = isPlayer1 ? match.player1_name : match.player2_name;
                opponentTeamName = opponentName;
                opponentPhone = isPlayer1 ? match.player2_phone : match.player1_phone;
              }

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
                  <td>
                    {match.is_doubles ? (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: '600', color: '#059669' }}>Rakip Takım:</div>
                        <div>{opponentTeamName}</div>
                      </div>
                    ) : (
                      opponentTeamName
                    )}
                  </td>
                  <td>{opponentPhone || '-'}</td>
                  <td>{match.group_name}</td>
                  <td>{match.gender === 'male' ? 'Erkek' : 'Kadın'} - {match.category_name}</td>
                  <td>
                    {hasScore ? (
                      <>
                        {match.player1_set1}-{match.player2_set1}, {match.player1_set2}-{match.player2_set2}
                        {match.super_tiebreak_p1 !== null && ` (ST: ${match.super_tiebreak_p1}-${match.super_tiebreak_p2})`}
                        {match.status === 'walkover' && ' ALARAK'}
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
                    {hasScore ? (
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
                    {(() => {
                      // Determine if current user is on the same team as the submitter
                      const currentUserIsTeam1 = match.player1_id === user.id || match.player1_partner_id === user.id;
                      const submitterIsTeam1 = match.submitted_by === match.player1_id || match.submitted_by === match.player1_partner_id;
                      const sameTeamAsSubmitter = currentUserIsTeam1 === submitterIsTeam1;

                      // Can approve only if: score exists, pending, not submitter, not same team (or admin)
                      const canApprove = hasScore &&
                                        match.approval_status === 'pending' &&
                                        match.submitted_by !== user.id &&
                                        (!sameTeamAsSubmitter || user.role === 'admin');

                      if (canApprove) {
                        return (
                          <button
                            className="btn btn-primary"
                            onClick={() => approveScore(match.id)}
                          >
                            Skoru Onayla
                          </button>
                        );
                      } else if (!hasScore && match.status !== 'walkover') {
                        return (
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
                        );
                      }
                      return null;
                    })()}
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
              {selectedMatch.is_doubles ? (
                <>
                  {selectedMatch.player1_name} / {selectedMatch.player1_partner_name}
                  {' vs '}
                  {selectedMatch.player2_name} / {selectedMatch.player2_partner_name}
                </>
              ) : (
                <>
                  {selectedMatch.player1_name} vs {selectedMatch.player2_name}
                </>
              )}
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
                    <option value={selectedMatch.player1_id}>
                      {selectedMatch.is_doubles && selectedMatch.player1_partner_name
                        ? `${selectedMatch.player1_name} / ${selectedMatch.player1_partner_name}`
                        : selectedMatch.player1_name}
                    </option>
                    <option value={selectedMatch.player2_id}>
                      {selectedMatch.is_doubles && selectedMatch.player2_partner_name
                        ? `${selectedMatch.player2_name} / ${selectedMatch.player2_partner_name}`
                        : selectedMatch.player2_name}
                    </option>
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>1. Set</label>
                    <div className="score-input">
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player1_partner_name
                            ? `${selectedMatch.player1_name} / ${selectedMatch.player1_partner_name}`
                            : selectedMatch.player1_name}
                        </label>
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
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player2_partner_name
                            ? `${selectedMatch.player2_name} / ${selectedMatch.player2_partner_name}`
                            : selectedMatch.player2_name}
                        </label>
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
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player1_partner_name
                            ? `${selectedMatch.player1_name} / ${selectedMatch.player1_partner_name}`
                            : selectedMatch.player1_name}
                        </label>
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
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player2_partner_name
                            ? `${selectedMatch.player2_name} / ${selectedMatch.player2_partner_name}`
                            : selectedMatch.player2_name}
                        </label>
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
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player1_partner_name
                            ? `${selectedMatch.player1_name} / ${selectedMatch.player1_partner_name}`
                            : selectedMatch.player1_name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={scoreData.super_tiebreak_p1}
                          onChange={(e) => setScoreData({ ...scoreData, super_tiebreak_p1: e.target.value })}
                        />
                      </div>
                      <span>-</span>
                      <div>
                        <label style={{ fontSize: '0.875rem' }}>
                          {selectedMatch.is_doubles && selectedMatch.player2_partner_name
                            ? `${selectedMatch.player2_name} / ${selectedMatch.player2_partner_name}`
                            : selectedMatch.player2_name}
                        </label>
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