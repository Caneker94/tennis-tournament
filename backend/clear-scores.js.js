import db, { initializeDatabase } from './database.js';

async function clearScores() {
  try {
    console.log('🧹 Tüm maç skorları siliniyor...\n');
    await initializeDatabase();

    // Önce mevcut durumu göster
    const matchScoresCount = await db.getAsync('SELECT COUNT(*) as count FROM match_scores');
    const completedMatches = await db.getAsync('SELECT COUNT(*) as count FROM matches WHERE status != "scheduled"');
    
    console.log('📊 Mevcut Durum:');
    console.log(`   • Toplam ${matchScoresCount.count} maç skoru`);
    console.log(`   • ${completedMatches.count} tamamlanmış/walkover maç`);
    console.log('');

    // Kullanıcıdan onay iste
    console.log('⚠️  UYARI: Bu işlem geri alınamaz!');
    console.log('   Aşağıdaki veriler silinecek:');
    console.log('   - Tüm maç skorları');
    console.log('   - Standings (puan durumu) sıfırlanacak');
    console.log('   - Maçlar "scheduled" durumuna dönecek');
    console.log('');

    // Silme işlemini başlat
    console.log('🔄 Silme işlemi başlıyor...\n');

    // 1. Match scores tablosunu temizle
    await db.runAsync('DELETE FROM match_scores');
    console.log('✅ Tüm maç skorları silindi');

    // 2. Maçları scheduled durumuna döndür
    await db.runAsync('UPDATE matches SET status = "scheduled"');
    console.log('✅ Tüm maçlar "scheduled" durumuna döndürüldü');

    // 3. Standings tablosunu sıfırla
    await db.runAsync(`
      UPDATE standings 
      SET points = 0, 
          matches_won = 0, 
          matches_lost = 0, 
          walkovers = 0,
          games_won = 0,
          games_total = 0
    `);
    console.log('✅ Puan durumu sıfırlandı (averaj dahil)');

    // Son durumu göster
    console.log('\n📊 Güncel Durum:');
    const newMatchScoresCount = await db.getAsync('SELECT COUNT(*) as count FROM match_scores');
    const newCompletedMatches = await db.getAsync('SELECT COUNT(*) as count FROM matches WHERE status != "scheduled"');
    const allMatches = await db.getAsync('SELECT COUNT(*) as count FROM matches');
    
    console.log(`   • Kalan maç skoru: ${newMatchScoresCount.count}`);
    console.log(`   • Tamamlanmış maç: ${newCompletedMatches.count}`);
    console.log(`   • Planlanmış maç: ${allMatches.count}`);

    console.log('\n✅ Temizlik başarıyla tamamlandı!');
    console.log('💡 Artık maç skorlarını yeniden girebilirsiniz.');
    console.log('💡 Yeni skorlar averaj sistemi ile birlikte hesaplanacak.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

clearScores();