import { useState, useEffect } from 'react';
import api from '../utils/api';
import PlayerProfile from '../components/PlayerProfile';

function Standings() {
  const [standings, setStandings] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  function getWeekLabel(weekNumber) {
    if (weekNumber === null || weekNumber === undefined) return '-';

    const raw = typeof weekNumber === 'string' ? weekNumber.trim() : weekNumber;
    const numeric = Number(raw);

    if (!Number.isNaN(numeric)) {
      if (numeric === 1 || numeric === 2) return 'Hafta 1-2';
      if (numeric === 3 || numeric === 4) return 'Hafta 3-4';
      if (numeric === 5 || numeric === 6) return 'Hafta 5-6';
      if (numeric === 7) return 'Hafta 7';
      return `Hafta ${numeric}`;
    }

    const text = raw.toString().trim();
    if (text.toLowerCase().startsWith('hafta')) {
      return text;
    }

    return `Hafta ${text}`;
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

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!selectedCategory || !selectedGroup) {
    return null;
  }

  const categoryData = standings[selectedCategory];
  const groupData = categoryData?.groups[selectedGroup];
  const groupMatches = groupData ? getGroupMatches(groupData.group_id) : [];
  const sortedGroupMatches = [...groupMatches].sort((a, b) => {
    const aWeek = Number(a.week_number);
    const bWeek = Number(b.week_number);

    if (!Number.isNaN(aWeek) && !Number.isNaN(bWeek) && aWeek !== bWeek) {
      return aWeek - bWeek;
    }

    return new Date(a.match_date) - new Date(b.match_date);
  });

  const normalizeName = (name) => (name || '').trim().toUpperCase();
  const resolveGroupKey = (groupName) => {
    const norm = normalizeName(groupName);
    const grpMatch = norm.match(/GRUP\s*([A-Z])/);
    if (grpMatch) return grpMatch[1];
    const lastChar = norm.replace(/[^A-Z]/g, '').slice(-1);
    if (lastChar) return lastChar;
    return norm;
  };

  // Partner eşleşmeleri: maçlardaki partner id + isimlerini map'le
  const partnerMap = new Map(); // playerId -> { id, name }
  sortedGroupMatches.forEach((match) => {
    if (match.player1_partner_id && match.player1_partner_name) {
      partnerMap.set(match.player1_id, { id: match.player1_partner_id, name: match.player1_partner_name });
      partnerMap.set(match.player1_partner_id, { id: match.player1_id, name: match.player1_name });
    }
    if (match.player2_partner_id && match.player2_partner_name) {
      partnerMap.set(match.player2_id, { id: match.player2_partner_id, name: match.player2_partner_name });
      partnerMap.set(match.player2_partner_id, { id: match.player2_id, name: match.player2_name });
    }
  });

  // Statik eşleşme yedeği (mix grupları)
  const staticMixPairs = {
    A: [
      ['AYŞE MERSİN', 'BURAK ÜN'],
      ['BERNA TAŞKIRAN', 'MURAT ZEKİ DİŞÇİ'],
      ['GAMZE KUŞ', 'EREN BÜYÜKÇOBAN'],
      ['MİRA YAVUZ', 'KUZEY BERKMAN'],
      ['SİBEL NALBANTOĞLU', 'NURETTİN AKYEL'],
      ['ŞULE ARSLAN', 'İRFAN KOÇAK'],
      ['OYA DENİZ', 'CÜNEYT GÜLER']
    ],
    B: [
      ['AYŞEN GÜÇLÜ', 'TUĞBERK GÜÇLÜ'],
      ['BEYZA GÜNDÜZ', 'ANIL ACAR'],
      ['CANSU BATTAL', 'SAMİ BATTAL'],
      ['ELİF CEREN ÇİFTÇİ', 'FATİH MEHMET ERDEM'],
      ['HABİBE ARICI', 'CAN EKER'],
      ['MELİSA ŞERİF', 'SERKAN GÜLTEKİN'],
      ['SEVİL ŞEKER', 'VELİ BURAK']
    ],
    C: [
      ['BEGÜM ÖZTÜRK', 'ANIL ÇANAKÇI'],
      ['BURCU İRDESEL', 'YİĞİT EKER'],
      ['EKİN BEŞİKCİOĞLU', 'OGÜN MERT KAYA'],
      ['EMEL GÖKÇE', 'KEREM BOZKURT'],
      ['MEHTAP TAŞTAN', 'ONUR FERE'],
      ['NECİBE TAŞYURT', 'AHMET TAŞYURT'],
      ['RANA TİLKİ', 'REŞAT CAN PİRİMOĞLU'],
      ['ECE ÜLÜK', 'EMRE CEBECİ']
    ],
    D: [
      ['ESMA SEVİM', 'UMUT YEŞİLIRMAK'],
      ['GÜLTEN ENGİN ÖZGEN', 'EREN ÖZGEN'],
      ['MELEK EVREN', 'KAAN TÜRKKAN'],
      ['MERVEGÜL AVŞAR', 'İBRAHİM ÖZTÜRK'],
      ['SÜMEYYE TOKDEMİR', 'EMİRHAN ÇETİN'],
      ['ŞEYMA ERTAŞ', 'CİHAN ERTAŞ'],
      ['TUBA DENİZCİ', 'OĞUZ AYAZ'],
      ['YAĞMUR BULUT GÖKÇEN', 'BATUHAN BEŞİKCİOĞLU']
    ]
  };

  if (groupData) {
    const groupKey = resolveGroupKey(selectedGroup);
    const staticPairs = staticMixPairs[groupKey] || [];
    const nameToId = new Map();

    // İsim varyantları (ör. "ZEKİ MURAT" vs "MURAT ZEKİ") için basit eşleme
    groupData.players.forEach((p) => {
      const base = normalizeName(p.player_name);
      nameToId.set(base, p.user_id);
      const parts = base.split(/\s+/);
      if (parts.length >= 3) {
        // İlk iki kelimeyi yer değiştir
        const swapped = [parts[1], parts[0], ...parts.slice(2)].join(' ');
        nameToId.set(swapped, p.user_id);
      }
    });

    staticPairs.forEach(([n1, n2]) => {
      const id1 = nameToId.get(normalizeName(n1));
      const id2 = nameToId.get(normalizeName(n2));
      if (id1 && id2) {
        partnerMap.set(id1, { id: id2, name: n2 });
        partnerMap.set(id2, { id: id1, name: n1 });
      }
    });
  }

  // Takım bazlı (doubles) puan satırlarını birleştir
  const playersById = new Map(groupData?.players.map(p => [p.user_id, p]) || []);
  const mergedRows = [];
  const seen = new Set();

  (groupData?.players || []).forEach((player) => {
    if (seen.has(player.user_id)) return;

    const partnerInfo = partnerMap.get(player.user_id);
    if (partnerInfo) {
      const partner = playersById.get(partnerInfo.id);
      // Partner yoksa tek olarak göster
      if (!partner) {
        mergedRows.push(player);
        seen.add(player.user_id);
        return;
      }

      // Aynı çiftin iki kere görünmemesi için küçük id'li oyuncuyu esas al
      if (partnerInfo.id < player.user_id) {
        return;
      }

      // Doubles maçlarında her iki partner de aynı istatistiklere sahip
      // Bu yüzden sadece bir oyuncunun istatistiklerini kullanıyoruz
      const points = player.points;
      const matches_won = player.matches_won;
      const matches_lost = player.matches_lost;
      const walkovers = player.walkovers;
      const games_won = player.games_won;
      const games_total = player.games_total;
      const averaj = games_total > 0 ? (games_won / games_total).toFixed(3) : '0.000';
      const matchesPlayed = matches_won + matches_lost + walkovers;

      mergedRows.push({
        user_id: player.user_id, // takım için birincil id
        partner_id: partnerInfo.id, // Partner ID'si
        is_team: true, // Bu bir takım
        player_name: `${player.player_name} / ${partner.player_name}`,
        points,
        matches_won,
        matches_lost,
        walkovers,
        games_won,
        games_total,
        averaj,
        matchesPlayed
      });

      seen.add(player.user_id);
      seen.add(partnerInfo.id);
    } else {
      mergedRows.push({
        ...player,
        matchesPlayed: player.matches_won + player.matches_lost + player.walkovers
      });
      seen.add(player.user_id);
    }
  });

  // Sıralama: puan, averaj
  mergedRows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return parseFloat(b.averaj) - parseFloat(a.averaj);
  });

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
                  {catData.category_name?.toLowerCase().includes('mix')
                    ? catData.category_name
                    : `${catData.gender === 'male' ? 'Erkekler' : 'Kadınlar'} - ${catData.category_name}`}
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
                    <th>{categoryData.category_name?.toLowerCase().includes('mix') ? 'Takım' : 'Oyuncu'}</th>
                    <th>Oynanan</th>
                    <th>Puan</th>
                    <th>Galibiyet</th>
                    <th>Mağlubiyet</th>
                    <th>Walkover</th>
                    <th>Averaj</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRows.map((player, index) => {
                    const isQualified = index < 4; // İlk 4 sıra bir sonraki tura çıkacak
                    const matchesPlayed = player.matchesPlayed ?? (player.matches_won + player.matches_lost + player.walkovers);
                    const displayName = player.player_name;

                    return (
                      <tr
                        key={player.user_id}
                        style={{
                          backgroundColor: isQualified ? '#dcfce7' : 'transparent',
                          fontWeight: isQualified ? '500' : 'normal'
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <span
                            onClick={() => {
                              if (player.is_team) {
                                setSelectedTeam({
                                  player1Id: player.user_id,
                                  player2Id: player.partner_id,
                                  teamName: player.player_name,
                                  groupId: groupData.group_id
                                });
                              } else {
                                setSelectedPlayerId(player.user_id);
                              }
                            }}
                            style={{
                              cursor: 'pointer',
                              color: '#4f46e5',
                              textDecoration: 'none',
                              borderBottom: '1px dotted #4f46e5'
                            }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {(player.player_name || '').toUpperCase()}
                          </span>
                        </td>
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
              {sortedGroupMatches.length > 0 && (
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
                      {sortedGroupMatches.map((match) => {
                        const status = match.status === 'completed'
                          ? 'Tamamlandı'
                          : match.status === 'walkover'
                          ? 'Walkover'
                          : 'Planlandı';

                        // For doubles matches, show partners
                        const player1Display = match.is_doubles && match.player1_partner_name
                          ? `${match.player1_name} / ${match.player1_partner_name}`
                          : match.player1_name;

                        const player2Display = match.is_doubles && match.player2_partner_name
                          ? `${match.player2_name} / ${match.player2_partner_name}`
                          : match.player2_name;

                        return (
                          <tr key={match.id}>
                            <td>{getWeekLabel(match.week_number)}</td>
                            <td>{new Date(match.match_date).toLocaleDateString('tr-TR')}</td>
                            <td>{match.venue || '-'}</td>
                            <td>{player1Display}</td>
                            <td>{player2Display}</td>
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

      {/* Player/Team Profile Modal */}
      {selectedPlayerId && (
        <PlayerProfile
          playerId={selectedPlayerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {selectedTeam && (
        <PlayerProfile
          playerId={selectedTeam.player1Id}
          partnerId={selectedTeam.player2Id}
          isTeam={true}
          teamName={selectedTeam.teamName}
          groupId={selectedTeam.groupId}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

export default Standings;