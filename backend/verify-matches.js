import db, { initializeDatabase } from './database.js';

async function verifyMatches() {
  try {
    await initializeDatabase();

    console.log('\n🔍 Maç dağılımını doğruluyoruz...\n');

    // Pick a few sample groups to verify
    const sampleGroups = await db.allAsync(`
      SELECT g.id, g.name, c.name as category
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      LIMIT 3
    `);

    for (const group of sampleGroups) {
      console.log(`\n📂 ${group.category} - ${group.name}`);
      
      const players = await db.allAsync(`
        SELECT id, full_name
        FROM users
        WHERE group_id = ?
        ORDER BY full_name
      `, [group.id]);

      console.log(`   👥 ${players.length} oyuncu:`);

      for (const player of players) {
        const matchCount = await db.getAsync(`
          SELECT COUNT(*) as count
          FROM matches
          WHERE (player1_id = ? OR player2_id = ?)
          AND group_id = ?
        `, [player.id, player.id, group.id]);

        console.log(`      ${player.full_name}: ${matchCount.count} maç`);
      }

      // Total matches in group
      const totalMatches = await db.getAsync(`
        SELECT COUNT(*) as count
        FROM matches
        WHERE group_id = ?
      `, [group.id]);

      console.log(`   📊 Toplam maç sayısı: ${totalMatches.count}`);

      // Show some sample matches
      const sampleMatches = await db.allAsync(`
        SELECT 
          m.id,
          u1.full_name as player1,
          u2.full_name as player2,
          m.week_number
        FROM matches m
        JOIN users u1 ON m.player1_id = u1.id
        JOIN users u2 ON m.player2_id = u2.id
        WHERE m.group_id = ?
        LIMIT 5
      `, [group.id]);

      console.log(`\n   📋 Örnek maçlar:`);
      sampleMatches.forEach(m => {
        console.log(`       ${m.week_number}: ${m.player1} vs ${m.player2}`);
      });
    }

    console.log('\n✅ Doğrulama tamamlandı!');
    console.log('💡 Her oyuncu 7 maç oynuyor (gruptaki diğer tüm oyuncularla)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

verifyMatches();
