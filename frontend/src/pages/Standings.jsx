import { useState, useEffect } from 'react';
import api from '../utils/api';

function Standings() {
  const [standings, setStandings] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  function getWeekLabel(weekNumber) {
    const labels = {
      1: 'Hafta 1-2',
      2: 'Hafta 3-4',
      3: 'Hafta 5-6',
      4: 'Hafta 7'
    };
    return labels[weekNumber] || `Hafta ${weekNumber}`;
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-select first category and group when data loads
    if (Object.keys(standings).length > 0 && !selectedCategory) {
      const firstCategoryKey = Object.keys(standings)[0];
      setSelectedCategory(firstCategoryKey);

      const firstGroupName = Object.keys(standings[firstCategoryKey].groups)[0];
      setSelectedGroup(firstGroupName);
    }
  }, [standings, selectedCategory]);

  async function loadData() {
    try {
      const [standingsRes, matchesRes] = await Promise.all([
        api.get('/standings/grouped'),
        api.get('/matches')
      ]);
      setStandings(standingsRes.data);
      setMatches(matchesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getGroupMatches(groupId) {
    return matches.filter(match => match.group_id === groupId);
  }

  function getScoreDisplay(match) {
    if (match.status === 'walkover') {
      return 'Walkover';
    }
    if (!match.player1_set1) return '-';

    let score = `${match.player1_set1}-${match.player2_set1}, ${match.player1_set2}-${match.player2_set2}`;
    if (match.super_tiebreak_p1 !== null) {
      score += ` (ST: ${match.super_tiebreak_p1}-${match.super_tiebreak_p2})`;
    }
    return score;
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!selectedCategory || !selectedGroup) {
    return null;
  }

  const categoryData = standings[selectedCategory];
  const groupData = categoryData?.groups[selectedGroup];
  const groupMatches = groupData ? getGroupMatches(groupData.group_id) : [];

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Puan Durumu</h2>

      {Object.keys(standings).length === 0 ? (
        <div className="card">
          <p>Henüz puan durumu bulunmamaktadır.</p>
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(standings).map(([categoryKey, catData]) => (
                <button
                  key={categoryKey}
                  onClick={() => {
                    setSelectedCategory(categoryKey);
                    const firstGroup = Object.keys(catData.groups)[0];
                    setSelectedGroup(firstGroup);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: selectedCategory === categoryKey ? '2px solid #4f46e5' : '1px solid #d1d5db',
                    backgroundColor: selectedCategory === categoryKey ? '#eef2ff' : 'white',
                    color: selectedCategory === categoryKey ? '#4f46e5' : '#374151',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: selectedCategory === categoryKey ? '600' : '400',
                    fontSize: '0.875rem'
                  }}
                >
                  {catData.gender === 'male' ? 'Erkekler' : 'Kadınlar'} - {catData.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* Group Tabs */}
          {categoryData && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.keys(categoryData.groups).map((groupName) => (
                  <button
                    key={groupName}
                    onClick={() => setSelectedGroup(groupName)}
                    style={{
                      padding: '0.375rem 0.875rem',
                      border: selectedGroup === groupName ? '2px solid #059669' : '1px solid #d1d5db',
                      backgroundColor: selectedGroup === groupName ? '#d1fae5' : 'white',
                      color: selectedGroup === groupName ? '#059669' : '#6b7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: selectedGroup === groupName ? '600' : '400',
                      fontSize: '0.875rem'
                    }}
                  >
                    {groupName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Group Content */}
          {groupData && (
            <div>
              {/* Standings Table */}
              <table className="table">
                <thead>
                  <tr>
                    <th>Sıra</th>
                    <th>Oyuncu</th>
                    <th>Oynanan</th>
                    <th>Puan</th>
                    <th>Galibiyet</th>
                    <th>Mağlubiyet</th>
                    <th>Walkover</th>
                    <th>Averaj</th>
                  </tr>
                </thead>
                <tbody>
                  {groupData.players.map((player, index) => {
                    const matchesPlayed = player.matches_won + player.matches_lost + player.walkovers;
                    const isQualified = index < 4; // İlk 4 sıra bir sonraki tura çıkacak

                    return (
                      <tr
                        key={player.user_id}
                        style={{
                          backgroundColor: isQualified ? '#dcfce7' : 'transparent',
                          fontWeight: isQualified ? '500' : 'normal'
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>{player.player_name}</td>
                        <td><strong>{matchesPlayed}</strong></td>
                        <td><strong>{player.points}</strong></td>
                        <td>{player.matches_won}</td>
                        <td>{player.matches_lost}</td>
                        <td>{player.walkovers}</td>
                        <td>
                          <span style={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontWeight: '600'
                          }}>
                            {player.averaj}
                          </span>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#9ca3af',
                            marginTop: '0.125rem'
                          }}>
                            ({player.games_won}/{player.games_total})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Group Matches */}
              {groupMatches.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h5 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                    Grup Maçları
                  </h5>
                  <table className="table" style={{ fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th>Hafta</th>
                        <th>Tarih</th>
                        <th>Tesis</th>
                        <th>Oyuncu 1</th>
                        <th>Oyuncu 2</th>
                        <th>Skor</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMatches.map((match) => {
                        const status = match.status === 'completed'
                          ? 'Tamamlandı'
                          : match.status === 'walkover'
                          ? 'Walkover'
                          : 'Planlandı';

                        return (
                          <tr key={match.id}>
                            <td>{getWeekLabel(match.week_number)}</td>
                            <td>{new Date(match.match_date).toLocaleDateString('tr-TR')}</td>
                            <td>{match.venue || '-'}</td>
                            <td>{match.player1_name}</td>
                            <td>{match.player2_name}</td>
                            <td>{getScoreDisplay(match)}</td>
                            <td>
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: match.status === 'completed' ? '#dcfce7' : match.status === 'walkover' ? '#fee2e2' : '#e0e7ff',
                                color: match.status === 'completed' ? '#16a34a' : match.status === 'walkover' ? '#dc2626' : '#4f46e5'
                              }}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Standings;