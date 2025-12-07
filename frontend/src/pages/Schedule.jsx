import { useState, useEffect } from 'react';
import api from '../utils/api';

function Schedule() {
  const [matches, setMatches] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

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
    loadMatches();
  }, [selectedWeek]);

  async function loadMatches() {
    try {
      const params = selectedWeek ? { week: selectedWeek } : {};
      const response = await api.get('/matches', { params });
      setMatches(response.data);

      // Extract unique weeks
      const uniqueWeeks = [...new Set(response.data.map(m => m.week_number))].sort((a, b) => a - b);
      setWeeks(uniqueWeeks);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMatchStatus(match) {
    if (match.status === 'walkover') {
      return 'Walkover';
    }
    if (match.status === 'completed' && match.winner_name) {
      return `Kazanan: ${match.winner_name}`;
    }
    return 'Planlandı';
  }

  function getScoreDisplay(match) {
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Maç Programı</h2>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
          <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
            <option value="">Tüm Haftalar</option>
            {weeks.map(week => (
              <option key={week} value={week}>{getWeekLabel(week)}</option>
            ))}
          </select>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="card">
          <p>Henüz maç programı bulunmamaktadır.</p>
        </div>
      ) : (
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
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id}>
                <td>{new Date(match.match_date).toLocaleDateString('tr-TR')}</td>
                <td>{getWeekLabel(match.week_number)}</td>
                <td>{match.venue || '-'}</td>
                <td>{match.gender === 'male' ? 'Erkek' : 'Kadın'} - {match.category_name}</td>
                <td>{match.group_name}</td>
                <td>{match.player1_name}</td>
                <td>{match.player2_name}</td>
                <td>{getScoreDisplay(match)}</td>
                <td>{getMatchStatus(match)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Schedule;
