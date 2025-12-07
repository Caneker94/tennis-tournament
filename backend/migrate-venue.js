import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./tournament.db');
db.runAsync = promisify(db.run.bind(db));
db.allAsync = promisify(db.all.bind(db));

async function migrate() {
  try {
    console.log('🔄 Veritabanı güncelleniyor...');

    // Check if column exists
    const tableInfo = await db.allAsync('PRAGMA table_info(matches)');
    const columnNames = tableInfo.map(col => col.name);

    // Add venue column if it doesn't exist
    if (!columnNames.includes('venue')) {
      await db.runAsync('ALTER TABLE matches ADD COLUMN venue TEXT');
      console.log('✅ venue kolonu eklendi');
    } else {
      console.log('ℹ️  venue kolonu zaten mevcut');
    }

    // Add scheduled_by column if it doesn't exist (who scheduled the match)
    if (!columnNames.includes('scheduled_by')) {
      await db.runAsync('ALTER TABLE matches ADD COLUMN scheduled_by INTEGER');
      console.log('✅ scheduled_by kolonu eklendi');
    } else {
      console.log('ℹ️  scheduled_by kolonu zaten mevcut');
    }

    console.log('\n✅ Veritabanı başarıyla güncellendi!');
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    db.close();
    process.exit(1);
  }
}

migrate();
