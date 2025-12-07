import db, { initializeDatabase } from './database.js';

async function migrateAddApproval() {
  try {
    console.log('🔄 Adding approval fields to match_scores table...');

    await initializeDatabase();

    // Add approval_status column
    try {
      await db.runAsync(`
        ALTER TABLE match_scores
        ADD COLUMN approval_status TEXT DEFAULT 'pending'
      `);
      console.log('✅ Added approval_status column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('ℹ️  approval_status column already exists');
      } else {
        throw err;
      }
    }

    // Add approved_by column
    try {
      await db.runAsync(`
        ALTER TABLE match_scores
        ADD COLUMN approved_by INTEGER
      `);
      console.log('✅ Added approved_by column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('ℹ️  approved_by column already exists');
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

migrateAddApproval();
