import db, { initializeDatabase } from './database.js';

async function fillGroups() {
  try {
    await initializeDatabase();

    const groups = await db.allAsync(`
      SELECT g.id, g.name, c.name as category, c.id as category_id
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      ORDER BY c.name, g.name
    `);

    console.log('\n🔧 Her grupta 8 oyuncu olması için dummy oyuncular ekleniyor...\n');

    let totalDummyPlayers = 0;

    for (const group of groups) {
      const players = await db.allAsync(`
        SELECT id, full_name
        FROM users
        WHERE group_id = ?
      `, [group.id]);

      const currentCount = players.length;
      const needed = 8 - currentCount;

      if (needed > 0) {
        console.log(`${group.category} - ${group.name}: ${currentCount} oyuncu → ${needed} dummy oyuncu ekleniyor...`);

        for (let i = 1; i <= needed; i++) {
          const dummyUsername = `dummy_g${group.id}_${i}`;
          const dummyFullName = `x${i}`;
          const dummyPassword = 'dummy123'; // Basit bir şifre

          await db.runAsync(`
            INSERT INTO users (username, password, full_name, role, group_id)
            VALUES (?, ?, ?, 'player', ?)
          `, [dummyUsername, dummyPassword, dummyFullName, group.id]);

          totalDummyPlayers++;
        }
        console.log(`   ✅ ${needed} dummy oyuncu eklendi`);
      } else if (needed === 0) {
        console.log(`${group.category} - ${group.name}: ${currentCount} oyuncu ✓ (Tam)`);
      }
    }

    console.log(`\n✅ Toplam ${totalDummyPlayers} dummy oyuncu eklendi`);
    console.log(`📊 Tüm gruplar şimdi 8 oyuncudan oluşuyor`);
    console.log(`💡 Not: Dummy oyuncular (x1, x2, vb.) gerçek oyuncularla değiştirilene kadar maçlara katılmazlar`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

fillGroups();
