import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./tournament.db');

// Promisify database methods
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Users table (admin + players)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'player')),
        phone TEXT,
        category_id INTEGER,
        group_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )
    `);

    // Categories table (Elite, Master, Rising)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
        UNIQUE(name, gender)
      )
    `);

    // Groups table (8 players per group)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        UNIQUE(category_id, name)
      )
    `);

    // Players in groups
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS group_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(group_id, user_id)
      )
    `);

    // Matches table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        match_date DATE NOT NULL,
        week_number INTEGER NOT NULL,
        status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'walkover')),
        venue TEXT,
        scheduled_by INTEGER,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (player1_id) REFERENCES users(id),
        FOREIGN KEY (player2_id) REFERENCES users(id)
      )
    `);

    // Match scores
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS match_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player1_set1 INTEGER,
        player2_set1 INTEGER,
        player1_set2 INTEGER,
        player2_set2 INTEGER,
        super_tiebreak_p1 INTEGER,
        super_tiebreak_p2 INTEGER,
        winner_id INTEGER,
        walkover_player_id INTEGER,
        submitted_by INTEGER NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approval_status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (winner_id) REFERENCES users(id),
        FOREIGN KEY (walkover_player_id) REFERENCES users(id),
        FOREIGN KEY (submitted_by) REFERENCES users(id)
      )
    `);

    // Standings/Points table with averaj
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        matches_won INTEGER DEFAULT 0,
        matches_lost INTEGER DEFAULT 0,
        walkovers INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        games_total INTEGER DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(group_id, user_id)
      )
    `);

    // Sponsors table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        link_url TEXT,
        display_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT 1
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default db;