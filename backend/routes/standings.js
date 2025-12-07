import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all standings grouped by category and group
router.get('/grouped', async (req, res) => {
  try {
    const standings = await db.allAsync(`
      SELECT 
        s.*,
        u.full_name as player_name,
        g.name as group_name,
        g.id as group_id,
        c.name as category_name,
        c.gender
      FROM standings s
      JOIN users u ON s.user_id = u.id
      JOIN groups g ON s.group_id = g.id
      JOIN categories c ON g.category_id = c.id
      ORDER BY c.gender, c.name, g.name
    `);

    // Group by category and then by group
    const grouped = {};
    
    for (const standing of standings) {
      const categoryKey = `${standing.gender}_${standing.category_name}`;
      
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = {
          gender: standing.gender,
          category_name: standing.category_name,
          groups: {}
        };
      }
      
      if (!grouped[categoryKey].groups[standing.group_name]) {
        grouped[categoryKey].groups[standing.group_name] = {
          group_id: standing.group_id,
          players: []
        };
      }
      
      // Averaj hesapla (0 bölme hatası için kontrol)
      const averaj = standing.games_total > 0 
        ? (standing.games_won / standing.games_total).toFixed(3)
        : '0.000';
      
      grouped[categoryKey].groups[standing.group_name].players.push({
        user_id: standing.user_id,
        player_name: standing.player_name,
        points: standing.points,
        matches_won: standing.matches_won,
        matches_lost: standing.matches_lost,
        walkovers: standing.walkovers,
        games_won: standing.games_won,
        games_total: standing.games_total,
        averaj: averaj
      });
    }

    // Her grubu puana ve averaja göre sırala
    for (const categoryKey in grouped) {
      for (const groupName in grouped[categoryKey].groups) {
        grouped[categoryKey].groups[groupName].players.sort((a, b) => {
          // Önce puana göre
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          // Puan eşitse averaja göre
          return parseFloat(b.averaj) - parseFloat(a.averaj);
        });
      }
    }

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

// Get standings for a specific group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const standings = await db.allAsync(`
      SELECT 
        s.*,
        u.full_name as player_name
      FROM standings s
      JOIN users u ON s.user_id = u.id
      WHERE s.group_id = ?
    `, [groupId]);

    // Averaj ekle ve sırala
    const standingsWithAveraj = standings.map(s => ({
      ...s,
      averaj: s.games_total > 0 
        ? (s.games_won / s.games_total).toFixed(3)
        : '0.000'
    }));

    // Puana ve averaja göre sırala
    standingsWithAveraj.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return parseFloat(b.averaj) - parseFloat(a.averaj);
    });

    res.json(standingsWithAveraj);
  } catch (error) {
    console.error('Error fetching group standings:', error);
    res.status(500).json({ error: 'Failed to fetch group standings' });
  }
});

export default router;