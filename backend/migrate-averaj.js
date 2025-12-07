import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./tournament.db');
db.runAsync = promisify(db.run.bind(db));
db.allAsync = promisify(db.all.bind(db));

async function migrate() {
  try {
    console.log('🔄 Averaj sütunları ekleniyor...');

    // Check if columns exist
    const tableInfo = await db.allAsync('PRAGMA table_info(standings)');
    const columnNames = tableInfo.map(col => col.name);

    // Add games_won column if it doesn't exist
    if (!columnNames.includes('games_won')) {
      await db.runAsync('ALTER TABLE standings ADD COLUMN games_won INTEGER DEFAULT 0');
      console.log('✅ games_won kolonu eklendi');
    } else {
      console.log('ℹ️  games_won kolonu zaten mevcut');
    }

    // Add games_total column if it doesn't exist
    if (!columnNames.includes('games_total')) {
      await db.runAsync('ALTER TABLE standings ADD COLUMN games_total INTEGER DEFAULT 0');
      console.log('✅ games_total kolonu eklendi');
    } else {
      console.log('ℹ️  games_total kolonu zaten mevcut');
    }

    console.log('\n✅ Migration başarıyla tamamlandı!');
    console.log('💡 Averaj hesaplama: games_won / games_total');
    
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    db.close();
    process.exit(1);
  }
}

migrate();