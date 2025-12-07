import db, { initializeDatabase } from './database.js';

async function migrateAddAverage() {
  try {
    console.log('🔄 Adding average column to standings table...');

    await initializeDatabase();

    // Add average column (stored as total_games_won and total_games_played)
    try {
      await db.runAsync(`
        ALTER TABLE standings
        ADD COLUMN total_games_won INTEGER DEFAULT 0
      `);
      console.log('✅ Added total_games_won column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('ℹ️  total_games_won column already exists');
      } else {
        throw err;
      }
    }

    try {
      await db.runAsync(`
        ALTER TABLE standings
        ADD COLUMN total_games_played INTEGER DEFAULT 0
      `);
      console.log('✅ Added total_games_played column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('ℹ️  total_games_played column already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateAddAverage();
