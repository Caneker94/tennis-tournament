import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./tournament.db');
db.runAsync = promisify(db.run.bind(db));
db.allAsync = promisify(db.all.bind(db));

async function migrate() {
  try {
    console.log('🔄 Veritabanı güncelleniyor...');

    // Check current column type
    const tableInfo = await db.allAsync('PRAGMA table_info(matches)');
    const weekNumberColumn = tableInfo.find(col => col.name === 'week_number');

    if (weekNumberColumn) {
      console.log(`📊 Mevcut week_number tipi: ${weekNumberColumn.type}`);
      
      if (weekNumberColumn.type === 'INTEGER') {
        console.log('🔧 week_number sütunu TEXT tipine dönüştürülüyor...');
        
        // SQLite doesn't support ALTER COLUMN TYPE directly
        // We need to recreate the table
        
        // 1. Create new table with TEXT week_number
        await db.runAsync(`
          CREATE TABLE matches_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            player1_id INTEGER NOT NULL,
            player2_id INTEGER NOT NULL,
            match_date DATE NOT NULL,
            week_number TEXT NOT NULL,
            status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'walkover')),
            venue TEXT,
            scheduled_by INTEGER,
            FOREIGN KEY (group_id) REFERENCES groups(id),
            FOREIGN KEY (player1_id) REFERENCES users(id),
            FOREIGN KEY (player2_id) REFERENCES users(id)
          )
        `);
        console.log('✅ Yeni tablo oluşturuldu');

        // 2. Copy data (if any exists)
        const existingMatches = await db.allAsync('SELECT COUNT(*) as count FROM matches');
        if (existingMatches[0].count > 0) {
          console.log(`📦 ${existingMatches[0].count} maç verisi aktarılıyor...`);
          await db.runAsync(`
            INSERT INTO matches_new (id, group_id, player1_id, player2_id, match_date, week_number, status, venue, scheduled_by)
            SELECT id, group_id, player1_id, player2_id, match_date, 
                   CAST(week_number AS TEXT), status, venue, scheduled_by
            FROM matches
          `);
          console.log('✅ Veriler aktarıldı');
        }

        // 3. Drop old table
        await db.runAsync('DROP TABLE matches');
        console.log('✅ Eski tablo silindi');

        // 4. Rename new table
        await db.runAsync('ALTER TABLE matches_new RENAME TO matches');
        console.log('✅ Yeni tablo yeniden adlandırıldı');

      } else {
        console.log('ℹ️  week_number zaten TEXT tipinde, güncelleme gerekmiyor');
      }
    } else {
      console.log('⚠️  week_number sütunu bulunamadı');
    }

    console.log('\n✅ Migration başarıyla tamamlandı!');
    console.log('💡 Şimdi "node generate-schedule.js" komutunu çalıştırabilirsiniz');
    
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    db.close();
    process.exit(1);
  }
}

migrate();