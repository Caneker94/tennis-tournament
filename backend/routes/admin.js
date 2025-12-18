import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.allAsync(
      'SELECT * FROM categories ORDER BY gender, name'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, gender } = req.body;
    
    await db.runAsync(
      'INSERT INTO categories (name, gender) VALUES (?, ?)',
      [name, gender]
    );
    
    res.json({ message: 'Category created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await db.allAsync(`
      SELECT g.*, c.name as category_name, c.gender,
             COUNT(DISTINCT gp.user_id) as player_count
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      LEFT JOIN group_players gp ON gp.group_id = g.id
      GROUP BY g.id
      ORDER BY c.gender, c.name, g.name
    `);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create group
router.post('/groups', async (req, res) => {
  try {
    const { name, category_id } = req.body;
    
    await db.runAsync(
      'INSERT INTO groups (name, category_id) VALUES (?, ?)',
      [name, category_id]
    );
    
    res.json({ message: 'Group created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Delete group
router.delete('/groups/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Get players in a group
router.get('/groups/:id/players', async (req, res) => {
  try {
    const players = await db.allAsync(`
      SELECT u.id, u.username, u.full_name, u.phone
      FROM users u
      INNER JOIN group_players gp ON u.id = gp.user_id
      WHERE gp.group_id = ?
      ORDER BY u.full_name
    `, [req.params.id]);
    res.json(players);
  } catch (error) {
    console.error('Error fetching group players:', error);
    res.status(500).json({ error: 'Failed to fetch group players' });
  }
});

// Add player to group
router.post('/groups/:id/players', async (req, res) => {
  try {
    const { user_id } = req.body;
    const groupId = req.params.id;

    // Check if group already has 8 players
    const playerCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM group_players WHERE group_id = ?',
      [groupId]
    );

    if (playerCount.count >= 8) {
      return res.status(400).json({ error: 'Grup zaten 8 oyuncuya sahip' });
    }

    // Check if player is already in this group
    const existing = await db.getAsync(
      'SELECT * FROM group_players WHERE group_id = ? AND user_id = ?',
      [groupId, user_id]
    );

    if (existing) {
      return res.status(400).json({ error: 'Oyuncu zaten bu grupta' });
    }

    // Add player to group_players table
    await db.runAsync(
      'INSERT INTO group_players (group_id, user_id) VALUES (?, ?)',
      [groupId, user_id]
    );

    // Also update the user's group_id in users table for backward compatibility
    await db.runAsync(
      'UPDATE users SET group_id = ? WHERE id = ?',
      [groupId, user_id]
    );

    res.json({ message: 'Oyuncu gruba eklendi' });
  } catch (error) {
    console.error('Error adding player to group:', error);
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Oyuncu zaten bu grupta' });
    } else {
      res.status(500).json({ error: 'Oyuncu eklenemedi' });
    }
  }
});

// Remove player from group
router.delete('/groups/:id/players/:userId', async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;

    // Remove from group_players table
    await db.runAsync(
      'DELETE FROM group_players WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    // Remove group_id from users table
    await db.runAsync(
      'UPDATE users SET group_id = NULL WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Oyuncu gruptan çıkarıldı' });
  } catch (error) {
    console.error('Error removing player from group:', error);
    res.status(500).json({ error: 'Oyuncu çıkarılamadı' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.allAsync(`
      SELECT u.*, c.name as category_name, g.name as group_name
      FROM users u
      LEFT JOIN categories c ON u.category_id = c.id
      LEFT JOIN groups g ON u.group_id = g.id
      ORDER BY u.role, u.full_name
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, password, full_name, role, phone, category_id, group_id } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.runAsync(
      'INSERT INTO users (username, password, full_name, role, phone, category_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, role, phone, category_id, group_id]
    );
    
    res.json({ message: 'User created successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { username, password, full_name, role, phone, category_id, group_id } = req.body;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.runAsync(
        'UPDATE users SET username = ?, password = ?, full_name = ?, role = ?, phone = ?, category_id = ?, group_id = ? WHERE id = ?',
        [username, hashedPassword, full_name, role, phone, category_id, group_id, req.params.id]
      );
    } else {
      await db.runAsync(
        'UPDATE users SET username = ?, full_name = ?, role = ?, phone = ?, category_id = ?, group_id = ? WHERE id = ?',
        [username, full_name, role, phone, category_id, group_id, req.params.id]
      );
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all sponsors
router.get('/sponsors', async (req, res) => {
  try {
    const sponsors = await db.allAsync(
      'SELECT * FROM sponsors ORDER BY display_order, name'
    );
    res.json(sponsors);
  } catch (error) {
    res.status(500).json({ error: 'Katkı sağlayanlar yüklenemedi' });
  }
});

// Create sponsor
router.post('/sponsors', async (req, res) => {
  try {
    const { name, logo_url, link_url, display_order, active } = req.body;

    await db.runAsync(
      'INSERT INTO sponsors (name, logo_url, link_url, display_order, active) VALUES (?, ?, ?, ?, ?)',
      [name, logo_url, link_url, display_order || 0, active !== false ? 1 : 0]
    );

    res.json({ message: 'Katkı sağlayan oluşturuldu' });
  } catch (error) {
    res.status(500).json({ error: 'Katkı sağlayan oluşturulamadı' });
  }
});

// Update sponsor
router.put('/sponsors/:id', async (req, res) => {
  try {
    const { name, logo_url, link_url, display_order, active } = req.body;

    await db.runAsync(
      'UPDATE sponsors SET name = ?, logo_url = ?, link_url = ?, display_order = ?, active = ? WHERE id = ?',
      [name, logo_url, link_url, display_order || 0, active !== false ? 1 : 0, req.params.id]
    );

    res.json({ message: 'Katkı sağlayan güncellendi' });
  } catch (error) {
    res.status(500).json({ error: 'Katkı sağlayan güncellenemedi' });
  }
});

// Delete sponsor
router.delete('/sponsors/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Katkı sağlayan silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Katkı sağlayan silinemedi' });
  }
});

// Admin: Update match score
router.put('/matches/:id/score', async (req, res) => {
  try {
    const matchId = req.params.id;
    const {
      player1_set1,
      player2_set1,
      player1_set2,
      player2_set2,
      super_tiebreak_p1,
      super_tiebreak_p2,
      is_walkover,
      walkover_player_id
    } = req.body;

    // Get match details
    const match = await db.getAsync(
      'SELECT * FROM matches WHERE id = ?',
      [matchId]
    );

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    let winnerId = null;
    let status = 'completed';

    if (is_walkover) {
      // Walkover: The player who didn't show up loses
      winnerId = walkover_player_id === match.player1_id ? match.player2_id : match.player1_id;
      status = 'walkover';
    } else {
      // Calculate winner based on sets
      const p1Sets = (player1_set1 > player2_set1 ? 1 : 0) + (player1_set2 > player2_set2 ? 1 : 0);
      const p2Sets = (player2_set1 > player1_set1 ? 1 : 0) + (player2_set2 > player1_set2 ? 1 : 0);

      if (p1Sets === p2Sets && super_tiebreak_p1 && super_tiebreak_p2) {
        // Super tiebreak decides
        winnerId = super_tiebreak_p1 > super_tiebreak_p2 ? match.player1_id : match.player2_id;
      } else if (p1Sets === p2Sets) {
        // Draw (shouldn't happen in tennis, but handle it)
        winnerId = -1;
      } else {
        winnerId = p1Sets > p2Sets ? match.player1_id : match.player2_id;
      }
    }

    // Check if score already exists
    const existingScore = await db.getAsync(
      'SELECT * FROM match_scores WHERE match_id = ?',
      [matchId]
    );

    if (existingScore) {
      // Update existing score
      await db.runAsync(`
        UPDATE match_scores 
        SET player1_set1 = ?, player2_set1 = ?, player1_set2 = ?, player2_set2 = ?,
            super_tiebreak_p1 = ?, super_tiebreak_p2 = ?, winner_id = ?, 
            walkover_player_id = ?, submitted_by = ?
        WHERE match_id = ?
      `, [
        is_walkover ? null : player1_set1,
        is_walkover ? null : player2_set1,
        is_walkover ? null : player1_set2,
        is_walkover ? null : player2_set2,
        is_walkover ? null : (super_tiebreak_p1 || null),
        is_walkover ? null : (super_tiebreak_p2 || null),
        winnerId,
        is_walkover ? walkover_player_id : null,
        req.user.id,
        matchId
      ]);
    } else {
      // Insert new score
      await db.runAsync(`
        INSERT INTO match_scores (
          match_id, player1_set1, player2_set1, player1_set2, player2_set2,
          super_tiebreak_p1, super_tiebreak_p2, winner_id, walkover_player_id, submitted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        matchId,
        is_walkover ? null : player1_set1,
        is_walkover ? null : player2_set1,
        is_walkover ? null : player1_set2,
        is_walkover ? null : player2_set2,
        is_walkover ? null : (super_tiebreak_p1 || null),
        is_walkover ? null : (super_tiebreak_p2 || null),
        winnerId,
        is_walkover ? walkover_player_id : null,
        req.user.id
      ]);
    }

    // Update match status
    await db.runAsync(
      'UPDATE matches SET status = ? WHERE id = ?',
      [status, matchId]
    );

    // Recalculate standings for the group
    await recalculateStandings(match.group_id);

    res.json({ message: 'Score updated successfully' });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Admin: Delete match
router.delete('/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;

    // Get match details before deletion
    const match = await db.getAsync(
      'SELECT group_id FROM matches WHERE id = ?',
      [matchId]
    );

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Delete match scores first
    await db.runAsync('DELETE FROM match_scores WHERE match_id = ?', [matchId]);
    
    // Delete match
    await db.runAsync('DELETE FROM matches WHERE id = ?', [matchId]);

    // Recalculate standings
    await recalculateStandings(match.group_id);

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Admin: Update match details (venue, date, time) - same as player schedule
router.put('/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { venue, match_date, match_time } = req.body;

    // Check if match exists
    const match = await db.getAsync('SELECT id FROM matches WHERE id = ?', [matchId]);
    if (!match) {
      return res.status(404).json({ error: 'Maç bulunamadı' });
    }

    // Update match (admin can override player scheduling)
    await db.runAsync(
      `UPDATE matches
       SET venue = ?, match_date = ?, match_time = ?
       WHERE id = ?`,
      [venue || null, match_date, match_time || null, matchId]
    );

    res.json({ message: 'Maç planlandı' });
  } catch (error) {
    console.error('Error scheduling match:', error);
    res.status(500).json({ error: 'Maç planlanamadı' });
  }
});

// Export all fixtures as CSV
router.get('/export-fixtures', async (req, res) => {
  try {
    const matches = await db.allAsync(`
      SELECT
        c.name as category_name,
        g.name as group_name,
        m.week_number as period,
        m.match_date,
        m.is_doubles,
        p1.full_name as player1_name,
        p2.full_name as player2_name,
        p1p.full_name as player1_partner_name,
        p2p.full_name as player2_partner_name,
        m.venue,
        m.status,
        ms.player1_set1,
        ms.player2_set1,
        ms.player1_set2,
        ms.player2_set2,
        ms.super_tiebreak_p1,
        ms.super_tiebreak_p2,
        winner.full_name as winner_name
      FROM matches m
      JOIN groups g ON m.group_id = g.id
      JOIN categories c ON g.category_id = c.id
      JOIN users p1 ON m.player1_id = p1.id
      JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users p1p ON m.player1_partner_id = p1p.id
      LEFT JOIN users p2p ON m.player2_partner_id = p2p.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      LEFT JOIN users winner ON ms.winner_id = winner.id
      ORDER BY c.name, g.name, m.week_number, m.match_date, m.match_time
    `);

    // Group matches by category and group
    const groupedMatches = {};
    for (const match of matches) {
      const key = `${match.category_name}|||${match.group_name}`;
      if (!groupedMatches[key]) {
        groupedMatches[key] = [];
      }
      groupedMatches[key].push(match);
    }

    // Create CSV content with groups separated
    let csv = '';

    for (const [key, groupMatches] of Object.entries(groupedMatches)) {
      const [category, group] = key.split('|||');

      // Add category and group header
      csv += `\n"${category} - ${group}"\n`;
      csv += 'Dönem,Tarih,Oyuncu 1,Oyuncu 2,Skor,Kazanan,Saha,Durum\n';

      for (const match of groupMatches) {
        const period = `Dönem ${match.period}`;
        const date = match.match_date;

        // For doubles matches, show partners
        const player1 = match.is_doubles && match.player1_partner_name
          ? `${match.player1_name} / ${match.player1_partner_name}`
          : match.player1_name;
        const player2 = match.is_doubles && match.player2_partner_name
          ? `${match.player2_name} / ${match.player2_partner_name}`
          : match.player2_name;

        let score = '-';
        if (match.status === 'completed' || match.status === 'walkover') {
          if (match.status === 'walkover') {
            score = `${match.player1_set1}-${match.player2_set1}, ${match.player1_set2}-${match.player2_set2} ALARAK`;
          } else {
            score = `${match.player1_set1}-${match.player2_set1}, ${match.player1_set2}-${match.player2_set2}`;
            if (match.super_tiebreak_p1 !== null) {
              score += ` (ST: ${match.super_tiebreak_p1}-${match.super_tiebreak_p2})`;
            }
          }
        }

        const winner = match.winner_name || '-';
        const venue = match.venue || '-';

        let status = 'Planlandı';
        if (match.status === 'completed') status = 'Tamamlandı';
        else if (match.status === 'walkover') status = 'Walkover';

        csv += `"${period}","${date}","${player1}","${player2}","${score}","${winner}","${venue}","${status}"\n`;
      }

      // Add blank line between groups
      csv += '\n';
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="fikstur.csv"');

    // Add BOM for Excel UTF-8 support and send CSV
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting fixtures:', error);
    res.status(500).json({ error: 'Fikstür export edilemedi' });
  }
});

// Get all matches for schedule view
router.get('/all-matches', async (req, res) => {
  try {
    const matches = await db.allAsync(`
      SELECT
        m.*,
        ms.player1_set1,
        ms.player2_set1,
        ms.player1_set2,
        ms.player2_set2,
        ms.super_tiebreak_p1,
        ms.super_tiebreak_p2,
        ms.winner_id,
        ms.walkover_player_id,
        p1.full_name as player1_name,
        p2.full_name as player2_name,
        p1p.full_name as player1_partner_name,
        p2p.full_name as player2_partner_name,
        g.name as group_name,
        c.name as category_name
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      JOIN users p1 ON m.player1_id = p1.id
      JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users p1p ON m.player1_partner_id = p1p.id
      LEFT JOIN users p2p ON m.player2_partner_id = p2p.id
      JOIN groups g ON m.group_id = g.id
      JOIN categories c ON g.category_id = c.id
      ORDER BY m.match_date, m.match_time, c.name, g.name
    `);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching all matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Helper function to recalculate standings
async function recalculateStandings(groupId) {
  try {
    // Get all players in the group (using group_players table)
    const players = await db.allAsync(
      'SELECT DISTINCT u.id FROM users u JOIN group_players gp ON u.id = gp.user_id WHERE gp.group_id = ?',
      [groupId]
    );

    // Reset standings
    await db.runAsync(
      'DELETE FROM standings WHERE group_id = ?',
      [groupId]
    );

    // Calculate standings for each player
    for (const player of players) {
      // Get all matches where this player participated (including as partner in doubles)
      const matches = await db.allAsync(`
        SELECT
          m.*,
          ms.winner_id,
          ms.walkover_player_id,
          ms.player1_set1,
          ms.player2_set1,
          ms.player1_set2,
          ms.player2_set2,
          ms.super_tiebreak_p1,
          ms.super_tiebreak_p2
        FROM matches m
        LEFT JOIN match_scores ms ON m.id = ms.match_id
        WHERE m.group_id = ?
        AND (m.player1_id = ? OR m.player2_id = ? OR m.player1_partner_id = ? OR m.player2_partner_id = ?)
        AND m.status IN ('completed', 'walkover')
      `, [groupId, player.id, player.id, player.id, player.id]);

      let wins = 0;
      let losses = 0;
      let walkovers = 0;
      let gamesWon = 0;
      let gamesTotal = 0;

      for (const match of matches) {
        // Determine if player is in team 1 or team 2
        const inTeam1 = match.player1_id === player.id || match.player1_partner_id === player.id;
        const inTeam2 = match.player2_id === player.id || match.player2_partner_id === player.id;

        // Check if player's team won
        const teamWon = (inTeam1 && match.winner_id === match.player1_id) ||
                        (inTeam2 && match.winner_id === match.player2_id);

        if (teamWon) {
          wins++;
        } else if (match.winner_id !== -1) {
          losses++;
        }

        // Check walkover
        if (match.status === 'walkover') {
          const walkedOver = match.walkover_player_id === player.id ||
                             (match.is_doubles && (match.walkover_player_id === match.player1_partner_id ||
                                                   match.walkover_player_id === match.player2_partner_id));
          if (walkedOver) {
            walkovers++;
          }
        }

        // Calculate game stats
        if (match.status === 'completed' && match.player1_set1 !== null) {
          const p1Games = (match.player1_set1 || 0) + (match.player1_set2 || 0);
          const p2Games = (match.player2_set1 || 0) + (match.player2_set2 || 0);

          let playerGames = inTeam1 ? p1Games : p2Games;
          let totalGames = p1Games + p2Games;

          // Süper tie break varsa 1 game olarak ekle
          if (match.super_tiebreak_p1 !== null && match.super_tiebreak_p2 !== null) {
            totalGames += 1;
            // Kazanan takımın game'ine 1 ekle
            const p1WonTiebreak = match.super_tiebreak_p1 > match.super_tiebreak_p2;
            if ((inTeam1 && p1WonTiebreak) || (inTeam2 && !p1WonTiebreak)) {
              playerGames += 1;
            }
          }

          gamesWon += playerGames;
          gamesTotal += totalGames;
        }
      }

      const points = (wins * 3) + (losses * 1);

      await db.runAsync(`
        INSERT INTO standings (group_id, user_id, points, matches_won, matches_lost, walkovers, games_won, games_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [groupId, player.id, points, wins, losses, walkovers, gamesWon, gamesTotal]);
    }
  } catch (error) {
    console.error('Error recalculating standings:', error);
    throw error;
  }
}

export default router;