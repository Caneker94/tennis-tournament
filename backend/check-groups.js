import db, { initializeDatabase } from './database.js';

async function checkGroups() {
  try {
    await initializeDatabase();

    const groups = await db.allAsync(`
      SELECT g.id, g.name, c.name as category, c.id as category_id
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      ORDER BY c.name, g.name
    `);

    console.log('\n📊 Grup Yapısı ve Oyuncu Sayıları:\n');

    for (const group of groups) {
      const players = await db.allAsync(`
        SELECT id, full_name, username
        FROM users
        WHERE group_id = ?
        ORDER BY full_name
      `, [group.id]);

      console.log(`${group.category} - ${group.name} (ID: ${group.id})`);
      console.log(`  👥 ${players.length} oyuncu`);
      if (players.length > 0) {
        players.forEach((p, idx) => {
          console.log(`     ${idx + 1}. ${p.full_name} (@${p.username})`);
        });
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

checkGroups();
