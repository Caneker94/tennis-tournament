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
             COUNT(DISTINCT u.id) as player_count
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      LEFT JOIN users u ON u.group_id = g.id
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
    res.status(500).json({ error: 'Failed to fetch sponsors' });
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
    
    res.json({ message: 'Sponsor created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sponsor' });
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
    
    res.json({ message: 'Sponsor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sponsor' });
  }
});

// Delete sponsor
router.delete('/sponsors/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Sponsor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sponsor' });
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

// Helper function to recalculate standings
async function recalculateStandings(groupId) {
  try {
    // Get all players in the group
    const players = await db.allAsync(
      'SELECT id FROM users WHERE group_id = ?',
      [groupId]
    );

    // Reset standings
    await db.runAsync(
      'DELETE FROM standings WHERE group_id = ?',
      [groupId]
    );

    // Calculate standings for each player
    for (const player of players) {
      const stats = await db.getAsync(`
        SELECT 
          COUNT(CASE WHEN ms.winner_id = ? THEN 1 END) as wins,
          COUNT(CASE WHEN ms.winner_id != ? AND ms.winner_id != -1 AND m.status = 'completed' THEN 1 END) as losses,
          COUNT(CASE WHEN m.status = 'walkover' AND ms.walkover_player_id = ? THEN 1 END) as walkovers
        FROM matches m
        LEFT JOIN match_scores ms ON m.id = ms.match_id
        WHERE m.group_id = ? AND (m.player1_id = ? OR m.player2_id = ?)
        AND m.status IN ('completed', 'walkover')
      `, [player.id, player.id, player.id, groupId, player.id, player.id]);

      const points = (stats.wins * 3) + (stats.losses * 1) + (stats.walkovers * 0);

      await db.runAsync(`
        INSERT INTO standings (group_id, user_id, points, matches_won, matches_lost, walkovers)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [groupId, player.id, points, stats.wins, stats.losses, stats.walkovers]);
    }
  } catch (error) {
    console.error('Error recalculating standings:', error);
    throw error;
  }
}

export default router;