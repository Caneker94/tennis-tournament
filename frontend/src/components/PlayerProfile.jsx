import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Modal.css';

function PlayerProfile({ playerId, partnerId, isTeam, teamName, groupId, onClose }) {
  const [playerData, setPlayerData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlayerProfile();
  }, [playerId, partnerId, groupId]);

  const fetchPlayerProfile = async () => {
    try {
      setLoading(true);
      const url = groupId ? `/players/${playerId}?groupId=${groupId}` : `/players/${playerId}`;
      const response = await api.get(url);
      setPlayerData(response.data);

      // Eğer takımsa, partnerin de bilgilerini al
      if (isTeam && partnerId) {
        const partnerUrl = groupId ? `/players/${partnerId}?groupId=${groupId}` : `/players/${partnerId}`;
        const partnerResponse = await api.get(partnerUrl);
        setPartnerData(partnerResponse.data);
      }
    } catch (error) {
      console.error('Error fetching player profile:', error);
      setError('Oyuncu bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getScoreDisplay = (match) => {
    if (!match.player1_set1 && !match.player2_set1) {
      return '-';
    }

    let score = `${match.player1_set1}-${match.player2_set1}`;
    if (match.player1_set2 !== null) {
      score += ` ${match.player1_set2}-${match.player2_set2}`;
    }
    if (match.super_tiebreak_p1 !== null) {
      score += ` (${match.super_tiebreak_p1}-${match.super_tiebreak_p2})`;
    }

    return score;
  };

  const getMatchResult = (match) => {
    if (!match.winner_id) return '';
    // Takım için her iki oyuncuyu kontrol et
    if (isTeam && partnerId) {
      return (match.winner_id === playerId || match.winner_id === partnerId) ? 'Kazandı' : 'Kaybetti';
    }
    return match.winner_id === playerId ? 'Kazandı' : 'Kaybetti';
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content player-profile-modal" onClick={(e) => e.stopPropagation()}>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content player-profile-modal" onClick={(e) => e.stopPropagation()}>
          <h2>Hata</h2>
          <p>{error || 'Oyuncu bulunamadı'}</p>
          <button onClick={onClose}>Kapat</button>
        </div>
      </div>
    );
  }

  // Takım istatistiklerini hesapla
  let displayData = {
    name: '',
    category: '',
    group: '',
    phone: '',
    stats: {},
    matches: [],
    player1Photo: null,
    player2Photo: null
  };

  if (isTeam && playerData && partnerData) {
    // Takım istatistikleri - Doubles'da her iki partner de aynı istatistiklere sahip
    // Bu yüzden sadece bir oyuncunun istatistiklerini kullanıyoruz
    displayData = {
      name: teamName || `${playerData.player.full_name} / ${partnerData.player.full_name}`,
      category: playerData.player.category,
      group: playerData.player.group_name,
      phone: '',
      stats: playerData.stats, // İki partner de aynı stats'a sahip, toplamıyoruz
      matches: playerData.matches, // Maçlar aynı (doubles maçları)
      player1Photo: playerData.player.profile_photo,
      player2Photo: partnerData.player.profile_photo
    };
  } else if (playerData) {
    // Tek oyuncu
    const { player, matches, stats } = playerData;
    displayData = {
      name: player.full_name,
      category: player.category,
      group: player.group_name,
      phone: player.phone,
      stats: stats,
      matches: matches,
      player1Photo: player.profile_photo,
      player2Photo: null
    };
  }

  const winRate = displayData.stats.matches_won + displayData.stats.matches_lost > 0
    ? ((displayData.stats.matches_won / (displayData.stats.matches_won + displayData.stats.matches_lost)) * 100).toFixed(1)
    : 0;
  const gameAverage = displayData.stats.games_total > 0
    ? (displayData.stats.games_won / displayData.stats.games_total).toFixed(2)
    : '0.00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content player-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="player-profile-header">
          {isTeam ? (
            // Takım için iki fotoğraf göster
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="player-profile-photo" style={{ width: '60px', height: '60px' }}>
                {displayData.player1Photo ? (
                  <img src={displayData.player1Photo} alt="Player 1" />
                ) : (
                  <div className="player-photo-placeholder">
                    <span>{displayData.name.split('/')[0].trim().charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="player-profile-photo" style={{ width: '60px', height: '60px' }}>
                {displayData.player2Photo ? (
                  <img src={displayData.player2Photo} alt="Player 2" />
                ) : (
                  <div className="player-photo-placeholder">
                    <span>{displayData.name.split('/')[1]?.trim().charAt(0) || 'T'}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Tek oyuncu için bir fotoğraf
            <div className="player-profile-photo">
              {displayData.player1Photo ? (
                <img src={displayData.player1Photo} alt={displayData.name} />
              ) : (
                <div className="player-photo-placeholder">
                  <span>{displayData.name.charAt(0)}</span>
                </div>
              )}
            </div>
          )}
          <div className="player-profile-info">
            <h2>{displayData.name}</h2>
            <p className="player-category">{displayData.category}</p>
            <p className="player-group">{displayData.group}</p>
          </div>
        </div>

        <div className="player-stats">
          <div className="stat-card">
            <div className="stat-value">{displayData.stats.points}</div>
            <div className="stat-label">Puan</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayData.stats.matches_won}-{displayData.stats.matches_lost}</div>
            <div className="stat-label">Galibiyet-Mağlubiyet</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{winRate}%</div>
            <div className="stat-label">Kazanma Oranı</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{gameAverage}</div>
            <div className="stat-label">Averaj</div>
          </div>
        </div>

        <div className="player-matches-section">
          <h3>Maç Takvimi</h3>
          {displayData.matches.length === 0 ? (
            <p className="no-matches">Henüz maç bulunmuyor</p>
          ) : (
            <div className="matches-table-container">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>Hafta</th>
                    <th>Tarih</th>
                    <th>Rakip</th>
                    <th>Tesis</th>
                    <th>Skor</th>
                    <th>Sonuç</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.matches.map((match) => (
                    <tr key={match.id}>
                      <td>Hafta {match.week_number}</td>
                      <td>{new Date(match.match_date).toLocaleDateString('tr-TR')}</td>
                      <td>{match.opponent_name}</td>
                      <td>{match.venue || '-'}</td>
                      <td>{getScoreDisplay(match)}</td>
                      <td>
                        <span className={`result-badge ${getMatchResult(match).toLowerCase()}`}>
                          {getMatchResult(match)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${match.status}`}>
                          {match.status === 'scheduled' ? 'Planlandı' : match.status === 'completed' ? 'Tamamlandı' : 'Walkover'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerProfile;
