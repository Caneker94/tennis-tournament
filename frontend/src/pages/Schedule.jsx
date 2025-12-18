import { useState, useEffect } from 'react';
import api from '../utils/api';

function Schedule() {
  const [matches, setMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllMatches();
  }, []);

  useEffect(() => {
    // Seçilen tarihe göre maçları filtrele
    if (allMatches.length > 0) {
      filterMatchesByDate(selectedDate);
    }
  }, [selectedDate, allMatches]);

  async function loadAllMatches() {
    try {
      const response = await api.get('/matches');
      setAllMatches(response.data);

      // Tüm benzersiz tarihleri al ve sırala
      const dates = [...new Set(response.data.map(m => m.match_date))].sort();
      setAvailableDates(dates);

      // Bugünün tarihini bul veya en yakın tarihe git
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = dates.indexOf(today);

      if (todayIndex !== -1) {
        // Bugün varsa, bugünü seç
        setSelectedDate(new Date(today));
      } else {
        // Bugün yoksa, en yakın gelecek tarihi bul
        const futureDates = dates.filter(d => d >= today);
        if (futureDates.length > 0) {
          setSelectedDate(new Date(futureDates[0]));
        } else if (dates.length > 0) {
          // Gelecek tarih yoksa, en son tarihi seç
          setSelectedDate(new Date(dates[dates.length - 1]));
        }
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterMatchesByDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const filtered = allMatches.filter(m => m.match_date === dateStr);

    // Sort by match_time (null values last)
    filtered.sort((a, b) => {
      // If both have time, sort by time
      if (a.match_time && b.match_time) {
        return a.match_time.localeCompare(b.match_time);
      }
      // If only a has time, a comes first
      if (a.match_time) return -1;
      // If only b has time, b comes first
      if (b.match_time) return 1;
      // If neither has time, maintain original order
      return 0;
    });

    setMatches(filtered);
  }

  function goToPreviousDay() {
    const currentIndex = availableDates.indexOf(selectedDate.toISOString().split('T')[0]);
    if (currentIndex > 0) {
      setSelectedDate(new Date(availableDates[currentIndex - 1]));
    }
  }

  function goToNextDay() {
    const currentIndex = availableDates.indexOf(selectedDate.toISOString().split('T')[0]);
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(new Date(availableDates[currentIndex + 1]));
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

    // Walkover durumunda "ALARAK" ekle
    if (match.status === 'walkover') {
      score += ' ALARAK';
    }

    return score;
  }

  function formatDateLong(date) {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  const currentIndex = availableDates.indexOf(selectedDate.toISOString().split('T')[0]);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < availableDates.length - 1;

  return (
    <div>
      {/* Date Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <button
          onClick={goToPreviousDay}
          disabled={!hasPrevious}
          className="btn"
          style={{
            padding: '0.5rem 1rem',
            opacity: hasPrevious ? 1 : 0.5,
            cursor: hasPrevious ? 'pointer' : 'not-allowed',
            minWidth: '100px'
          }}
        >
          ← Önceki Gün
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: 0, color: '#059669' }}>
            {formatDateLong(selectedDate)}
          </h2>
          {isToday(selectedDate) && (
            <span style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#d1fae5',
              color: '#059669',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              BUGÜN
            </span>
          )}
        </div>

        <button
          onClick={goToNextDay}
          disabled={!hasNext}
          className="btn"
          style={{
            padding: '0.5rem 1rem',
            opacity: hasNext ? 1 : 0.5,
            cursor: hasNext ? 'pointer' : 'not-allowed',
            minWidth: '100px'
          }}
        >
          Sonraki Gün →
        </button>
      </div>

      {/* Match Count Info */}
      {matches.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.375rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          Bu tarihte <strong>{matches.length}</strong> maç planlanmış
        </div>
      )}

      {/* Matches Table */}
      {matches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Bu tarihte planlanmış maç bulunmamaktadır.
          </p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Saat</th>
              <th>Kategori</th>
              <th>Grup</th>
              <th>Oyuncu 1</th>
              <th>Oyuncu 2</th>
              <th>Tesis</th>
              <th>Skor</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              // Doubles maçları için partner isimlerini göster
              const player1Display = match.is_doubles && match.player1_partner_name
                ? `${match.player1_name} / ${match.player1_partner_name}`
                : match.player1_name;

              const player2Display = match.is_doubles && match.player2_partner_name
                ? `${match.player2_name} / ${match.player2_partner_name}`
                : match.player2_name;

              return (
                <tr key={match.id}>
                  <td style={{ fontWeight: '600' }}>{match.match_time || '-'}</td>
                  <td>
                    {match.category_name?.toLowerCase().includes('mix')
                      ? match.category_name
                      : `${match.gender === 'male' ? 'Erkek' : 'Kadın'} - ${match.category_name}`}
                  </td>
                  <td>{match.group_name}</td>
                  <td>{player1Display}</td>
                  <td>{player2Display}</td>
                  <td>{match.venue || '-'}</td>
                  <td>{getScoreDisplay(match)}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor:
                        match.status === 'completed' ? '#dcfce7' :
                        match.status === 'walkover' ? '#fee2e2' :
                        '#e0e7ff',
                      color:
                        match.status === 'completed' ? '#16a34a' :
                        match.status === 'walkover' ? '#dc2626' :
                        '#4f46e5'
                    }}>
                      {match.status === 'completed' ? 'Tamamlandı' :
                       match.status === 'walkover' ? 'Walkover' :
                       'Planlandı'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Schedule;
