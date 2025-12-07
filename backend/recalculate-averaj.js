import db, { initializeDatabase } from './database.js';

// Averaj hesaplama fonksiyonu
function calculateGameStats(p1Set1, p2Set1, p1Set2, p2Set2, p1ST, p2ST) {
  // Her oyuncu için kazandığı game sayısı
  const player1Games = p1Set1 + p1Set2;
  const player2Games = p2Set1 + p2Set2;
  
  let totalGames = player1Games + player2Games;
  let p1TotalGames = player1Games;
  let p2TotalGames = player2Games;
  
  // Süper tie break varsa sadece 1 game olarak ekle
  if (p1ST !== null && p2ST !== null) {
    totalGames += 1; // Süper tie break 1 game sayılır
    // Kazanana 1 game ekle
    if (p1ST > p2ST) {
      p1TotalGames += 1;
    } else {
      p2TotalGames += 1;
    }
  }
  
  return {
    player1: { gamesWon: p1TotalGames, gamesTotal: totalGames },
    player2: { gamesWon: p2TotalGames, gamesTotal: totalGames }
  };
}

async function recalculateAveraj() {
  try {
    console.log('🔄 Tüm maçlar için averaj yeniden hesaplanıyor...\n');
    await initializeDatabase();

    // Önce tüm standings'lerdeki averaj değerlerini sıfırla
    console.log('🧹 Mevcut averaj değerleri temizleniyor...');
    await db.runAsync(`
      UPDATE standings 
      SET games_won = 0, games_total = 0
    `);
    console.log('✅ Temizlik tamamlandı\n');

    // Tüm onaylanmış maç skorlarını al
    const matches = await db.allAsync(`
      SELECT 
        m.id as match_id,
        m.group_id,
        m.player1_id,
        m.player2_id,
        m.status,
        ms.player1_set1,
        ms.player2_set1,
        ms.player1_set2,
        ms.player2_set2,
        ms.super_tiebreak_p1,
        ms.super_tiebreak_p2,
        ms.walkover_player_id,
        ms.approval_status
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      WHERE (m.status = 'completed' OR m.status = 'walkover')
        AND (ms.approval_status = 'approved' OR m.status = 'walkover')
      ORDER BY m.id
    `);

    console.log(`📊 Toplam ${matches.length} onaylanmış maç bulundu\n`);

    let processedCount = 0;
    let walkoverCount = 0;
    let normalMatchCount = 0;

    for (const match of matches) {
      if (match.status === 'walkover') {
        // Walkover maçlar için averaj hesaplanmaz, sadece sayalım
        walkoverCount++;
        console.log(`⚠️  Maç #${match.match_id}: Walkover (averaj hesaplanmaz)`);
        continue;
      }

      // Normal maçlar için averaj hesapla
      if (match.player1_set1 !== null && match.player2_set1 !== null &&
          match.player1_set2 !== null && match.player2_set2 !== null) {
        
        const gameStats = calculateGameStats(
          match.player1_set1,
          match.player2_set1,
          match.player1_set2,
          match.player2_set2,
          match.super_tiebreak_p1,
          match.super_tiebreak_p2
        );

        // Player 1 için averaj güncelle
        await db.runAsync(`
          UPDATE standings 
          SET games_won = games_won + ?,
              games_total = games_total + ?
          WHERE group_id = ? AND user_id = ?
        `, [
          gameStats.player1.gamesWon,
          gameStats.player1.gamesTotal,
          match.group_id,
          match.player1_id
        ]);

        // Player 2 için averaj güncelle
        await db.runAsync(`
          UPDATE standings 
          SET games_won = games_won + ?,
              games_total = games_total + ?
          WHERE group_id = ? AND user_id = ?
        `, [
          gameStats.player2.gamesWon,
          gameStats.player2.gamesTotal,
          match.group_id,
          match.player2_id
        ]);

        normalMatchCount++;
        
        // Maç detaylarını göster
        const p1Games = gameStats.player1.gamesWon;
        const p2Games = gameStats.player2.gamesWon;
        const total = gameStats.player1.gamesTotal;
        const stInfo = match.super_tiebreak_p1 ? ` + ST(${match.super_tiebreak_p1}-${match.super_tiebreak_p2})` : '';
        
        console.log(`✅ Maç #${match.match_id}: ${match.player1_set1}-${match.player2_set1}, ${match.player1_set2}-${match.player2_set2}${stInfo} → P1: ${p1Games}/${total}, P2: ${p2Games}/${total}`);
        
        processedCount++;
      } else {
        console.log(`⚠️  Maç #${match.match_id}: Eksik skor verisi, atlandı`);
      }
    }

    // Sonuçları göster
    console.log('\n' + '='.repeat(70));
    console.log('📈 ÖZET');
    console.log('='.repeat(70));
    console.log(`✅ Başarıyla işlenen maçlar: ${normalMatchCount}`);
    console.log(`⚠️  Walkover maçlar: ${walkoverCount}`);
    console.log(`📊 Toplam işlem: ${processedCount + walkoverCount} maç`);

    // Güncellenmiş standings'leri göster
    console.log('\n' + '='.repeat(70));
    console.log('📊 GÜNCELLENMIŞ AVERAJLAR');
    console.log('='.repeat(70));

    const standings = await db.allAsync(`
      SELECT 
        s.*,
        u.full_name,
        g.name as group_name,
        c.name as category_name
      FROM standings s
      JOIN users u ON s.user_id = u.id
      JOIN groups g ON s.group_id = g.id
      JOIN categories c ON g.category_id = c.id
      WHERE s.games_total > 0
      ORDER BY c.name, g.name, s.points DESC, 
               (CAST(s.games_won AS REAL) / s.games_total) DESC
    `);

    let currentCategory = '';
    let currentGroup = '';

    for (const standing of standings) {
      const categoryLabel = `${standing.category_name}`;
      const groupLabel = standing.group_name;
      
      if (categoryLabel !== currentCategory) {
        console.log(`\n📂 ${categoryLabel}`);
        currentCategory = categoryLabel;
        currentGroup = '';
      }
      
      if (groupLabel !== currentGroup) {
        console.log(`  └─ ${groupLabel}`);
        currentGroup = groupLabel;
      }
      
      const averaj = standing.games_total > 0 
        ? (standing.games_won / standing.games_total).toFixed(3)
        : '0.000';
      
      console.log(`     • ${standing.full_name.padEnd(25)} | Puan: ${standing.points.toString().padStart(2)} | Averaj: ${averaj} (${standing.games_won}/${standing.games_total})`);
    }

    console.log('\n✅ Averaj yeniden hesaplama tamamlandı!');
    console.log('💡 Artık puan sıralamasında eşitlik durumunda averaj kullanılacak.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

recalculateAveraj();