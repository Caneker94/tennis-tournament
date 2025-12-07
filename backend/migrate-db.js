import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./tournament.db');
db.runAsync = promisify(db.run.bind(db));
db.allAsync = promisify(db.all.bind(db));

async function migrate() {
  try {
    console.log('🔄 Veritabanı güncelleniyor...');

    // Check if columns exist
    const tableInfo = await db.allAsync('PRAGMA table_info(users)');
    const columnNames = tableInfo.map(col => col.name);

    // Add phone column if it doesn't exist
    if (!columnNames.includes('phone')) {
      await db.runAsync('ALTER TABLE users ADD COLUMN phone TEXT');
      console.log('✅ phone kolonu eklendi');
    } else {
      console.log('ℹ️  phone kolonu zaten mevcut');
    }

    // Add category_id column if it doesn't exist
    if (!columnNames.includes('category_id')) {
      await db.runAsync('ALTER TABLE users ADD COLUMN category_id INTEGER');
      console.log('✅ category_id kolonu eklendi');
    } else {
      console.log('ℹ️  category_id kolonu zaten mevcut');
    }

    // Add group_id column if it doesn't exist
    if (!columnNames.includes('group_id')) {
      await db.runAsync('ALTER TABLE users ADD COLUMN group_id INTEGER');
      console.log('✅ group_id kolonu eklendi');
    } else {
      console.log('ℹ️  group_id kolonu zaten mevcut');
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
