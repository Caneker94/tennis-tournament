import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Puan ve averaj hesaplama fonksiyonu
async function updateStandings(matchId, scoreData) {
  // Match bilgilerini al
  const match = await db.getAsync(
    'SELECT * FROM matches WHERE id = ?',
    [matchId]
  );

  if (!match) {
    throw new Error('Match not found');
  }

  // Averaj hesaplama fonksiyonu
  function calculateGameStats(p1Set1, p2Set1, p1Set2, p2Set2, p1ST, p2ST) {
    // Her oyuncu için kazandığı game sayısı
    const player1Games = p1Set1 + p1Set2;
    const player2Games = p2Set1 + p2Set2;
    
    let totalGames = player1Games + player2Games;
    let p1TotalGames = player1Games;
    let p2TotalGames = player2Games;
    
    // Süper tie break varsa sadece 1 game olarak ekle
    if (p1ST !== null && p2ST !== null) {
      totalGames += 1; // Süper tie break 1 game sayılır
      // Kazanana 1 game ekle
      if (p1ST > p2ST) {
        p1TotalGames += 1;
      } else {
        p2TotalGames += 1;
      }
    }
    
    return {
      player1: { gamesWon: p1TotalGames, gamesTotal: totalGames },
      player2: { gamesWon: p2TotalGames, gamesTotal: totalGames }
    };
  }

  if (scoreData.is_walkover) {
    // Walkover durumu - 6-0, 6-0 olarak hesaplanır
    const walkoverPlayerId = scoreData.walkover_player_id;
    const winnerPlayerId = walkoverPlayerId === match.player1_id
      ? match.player2_id
      : match.player1_id;

    // Maç durumunu güncelle
    await db.runAsync(
      'UPDATE matches SET status = ? WHERE id = ?',
      ['walkover', matchId]
    );

    // Walkover 6-0, 6-0 olarak hesaplanır
    // Kazanan: 12 games kazandı, 12 toplam
    // Walkover yapan: 0 games kazandı, 12 toplam
    const winnerGamesWon = 12;
    const walkoverGamesWon = 0;
    const totalGames = 12;

    // Walkover eden oyuncunun standings'ini güncelle (0 puan, game istatistikleri eklenir)
    await db.runAsync(
      `UPDATE standings
       SET walkovers = walkovers + 1,
           matches_lost = matches_lost + 1,
           games_won = games_won + ?,
           games_total = games_total + ?
       WHERE group_id = ? AND user_id = ?`,
      [walkoverGamesWon, totalGames, match.group_id, walkoverPlayerId]
    );

    // Kazanan oyuncunun standings'ini güncelle (3 puan, game istatistikleri eklenir)
    await db.runAsync(
      `UPDATE standings
       SET points = points + 3,
           matches_won = matches_won + 1,
           games_won = games_won + ?,
           games_total = games_total + ?
       WHERE group_id = ? AND user_id = ?`,
      [winnerGamesWon, totalGames, match.group_id, winnerPlayerId]
    );

    // For doubles matches, update partner standings too
    if (match.is_doubles) {
      const walkoverPartnerId = walkoverPlayerId === match.player1_id
        ? match.player1_partner_id
        : match.player2_partner_id;
      const winnerPartnerId = walkoverPlayerId === match.player1_id
        ? match.player2_partner_id
        : match.player1_partner_id;

      // Walkover eden partnerin standings'ini güncelle (0 puan, game istatistikleri eklenir)
      await db.runAsync(
        `UPDATE standings
         SET walkovers = walkovers + 1,
             matches_lost = matches_lost + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [walkoverGamesWon, totalGames, match.group_id, walkoverPartnerId]
      );

      // Kazanan partnerin standings'ini güncelle (3 puan, game istatistikleri eklenir)
      await db.runAsync(
        `UPDATE standings
         SET points = points + 3,
             matches_won = matches_won + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [winnerGamesWon, totalGames, match.group_id, winnerPartnerId]
      );
    }

    return winnerPlayerId;
  } else {
    // Normal maç skorları
    const p1Set1 = parseInt(scoreData.player1_set1);
    const p2Set1 = parseInt(scoreData.player2_set1);
    const p1Set2 = parseInt(scoreData.player1_set2);
    const p2Set2 = parseInt(scoreData.player2_set2);
    const p1ST = scoreData.super_tiebreak_p1 ? parseInt(scoreData.super_tiebreak_p1) : null;
    const p2ST = scoreData.super_tiebreak_p2 ? parseInt(scoreData.super_tiebreak_p2) : null;

    // Kazananı belirle
    let p1Sets = 0;
    let p2Sets = 0;

    if (p1Set1 > p2Set1) p1Sets++; else p2Sets++;
    if (p1Set2 > p2Set2) p1Sets++; else p2Sets++;

    // Süper tie break varsa onu da kontrol et
    if (p1ST !== null && p2ST !== null) {
      if (p1ST > p2ST) p1Sets++; else p2Sets++;
    }

    let winnerId;
    let loserId;

    if (p1Sets > p2Sets) {
      winnerId = match.player1_id;
      loserId = match.player2_id;
    } else if (p2Sets > p1Sets) {
      winnerId = match.player2_id;
      loserId = match.player1_id;
    } else {
      // Berabere (nadiren olur ama ekleyelim)
      winnerId = -1; // Berabere işareti
      loserId = -1;
    }

    // Averaj hesapla
    const gameStats = calculateGameStats(p1Set1, p2Set1, p1Set2, p2Set2, p1ST, p2ST);

    // Maç durumunu güncelle
    await db.runAsync(
      'UPDATE matches SET status = ? WHERE id = ?',
      ['completed', matchId]
    );

    // Player 1 standings güncelle
    if (winnerId === match.player1_id) {
      await db.runAsync(
        `UPDATE standings 
         SET points = points + 3, 
             matches_won = matches_won + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_id]
      );
    } else if (winnerId === -1) {
      // Berabere
      await db.runAsync(
        `UPDATE standings 
         SET points = points + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_id]
      );
    } else {
      await db.runAsync(
        `UPDATE standings 
         SET points = points + 1, 
             matches_lost = matches_lost + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_id]
      );
    }

    // Player 2 standings güncelle
    if (winnerId === match.player2_id) {
      await db.runAsync(
        `UPDATE standings
         SET points = points + 3,
             matches_won = matches_won + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_id]
      );
    } else if (winnerId === -1) {
      // Berabere
      await db.runAsync(
        `UPDATE standings
         SET points = points + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_id]
      );
    } else {
      await db.runAsync(
        `UPDATE standings
         SET points = points + 1,
             matches_lost = matches_lost + 1,
             games_won = games_won + ?,
             games_total = games_total + ?
         WHERE group_id = ? AND user_id = ?`,
        [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_id]
      );
    }

    // For doubles matches, update partner standings too
    if (match.is_doubles && match.player1_partner_id && match.player2_partner_id) {
      // Player 1 Partner standings güncelle
      if (winnerId === match.player1_id) {
        await db.runAsync(
          `UPDATE standings
           SET points = points + 3,
               matches_won = matches_won + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_partner_id]
        );
      } else if (winnerId === -1) {
        // Berabere
        await db.runAsync(
          `UPDATE standings
           SET points = points + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_partner_id]
        );
      } else {
        await db.runAsync(
          `UPDATE standings
           SET points = points + 1,
               matches_lost = matches_lost + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player1.gamesWon, gameStats.player1.gamesTotal, match.group_id, match.player1_partner_id]
        );
      }

      // Player 2 Partner standings güncelle
      if (winnerId === match.player2_id) {
        await db.runAsync(
          `UPDATE standings
           SET points = points + 3,
               matches_won = matches_won + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_partner_id]
        );
      } else if (winnerId === -1) {
        // Berabere
        await db.runAsync(
          `UPDATE standings
           SET points = points + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_partner_id]
        );
      } else {
        await db.runAsync(
          `UPDATE standings
           SET points = points + 1,
               matches_lost = matches_lost + 1,
               games_won = games_won + ?,
               games_total = games_total + ?
           WHERE group_id = ? AND user_id = ?`,
          [gameStats.player2.gamesWon, gameStats.player2.gamesTotal, match.group_id, match.player2_partner_id]
        );
      }
    }

    return winnerId;
  }
}

// Get all matches (optionally filtered by week and category)
router.get('/', async (req, res) => {
  try {
    const { week, category_id } = req.query;

    let query = `
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
        w.full_name as winner_name,
        g.name as group_name,
        c.name as category_name,
        c.gender
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      JOIN users p1 ON m.player1_id = p1.id
      JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users p1p ON m.player1_partner_id = p1p.id
      LEFT JOIN users p2p ON m.player2_partner_id = p2p.id
      LEFT JOIN users w ON ms.winner_id = w.id
      JOIN groups g ON m.group_id = g.id
      JOIN categories c ON g.category_id = c.id
    `;

    const params = [];
    const conditions = [];

    if (week) {
      conditions.push('m.week_number = ?');
      params.push(week);
    }

    if (category_id) {
      conditions.push('g.category_id = ?');
      params.push(category_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.match_date, m.match_time, g.name';

    const matches = await db.allAsync(query, params);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get my matches (requires authentication)
router.get('/my-matches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
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
        ms.submitted_by,
        ms.approval_status,
        p1.full_name as player1_name,
        p1.phone as player1_phone,
        p2.full_name as player2_name,
        p2.phone as player2_phone,
        p1p.full_name as player1_partner_name,
        p1p.phone as player1_partner_phone,
        p2p.full_name as player2_partner_name,
        p2p.phone as player2_partner_phone,
        w.full_name as winner_name,
        g.name as group_name,
        c.name as category_name,
        c.gender
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      JOIN users p1 ON m.player1_id = p1.id
      JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users p1p ON m.player1_partner_id = p1p.id
      LEFT JOIN users p2p ON m.player2_partner_id = p2p.id
      LEFT JOIN users w ON ms.winner_id = w.id
      JOIN groups g ON m.group_id = g.id
      JOIN categories c ON g.category_id = c.id
      WHERE m.player1_id = ? OR m.player2_id = ? OR m.player1_partner_id = ? OR m.player2_partner_id = ?
      ORDER BY m.week_number, m.match_date, m.match_time
    `, [userId, userId, userId, userId]);
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching my matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Schedule a match (set date, time and venue)
router.put('/:id/schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { match_date, match_time, venue } = req.body;
    const userId = req.user.id;

    // Verify user is part of this match (including as a partner)
    const match = await db.getAsync(
      'SELECT * FROM matches WHERE id = ? AND (player1_id = ? OR player2_id = ? OR player1_partner_id = ? OR player2_partner_id = ?)',
      [id, userId, userId, userId, userId]
    );

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    await db.runAsync(
      'UPDATE matches SET match_date = ?, match_time = ?, venue = ?, scheduled_by = ? WHERE id = ?',
      [match_date, match_time, venue, userId, id]
    );

    res.json({ message: 'Match scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling match:', error);
    res.status(500).json({ error: 'Failed to schedule match' });
  }
});

// Submit match score
router.post('/:id/score', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const scoreData = req.body;

    // Verify user is part of this match (including doubles partners)
    const match = await db.getAsync(
      'SELECT * FROM matches WHERE id = ? AND (player1_id = ? OR player2_id = ? OR player1_partner_id = ? OR player2_partner_id = ?)',
      [id, userId, userId, userId, userId]
    );

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    // Check if score already exists
    const existingScore = await db.getAsync(
      'SELECT * FROM match_scores WHERE match_id = ?',
      [id]
    );

    if (existingScore) {
      return res.status(400).json({ error: 'Score already submitted for this match' });
    }

    let winnerId = null;

    if (scoreData.is_walkover) {
      const walkoverPlayerId = scoreData.walkover_player_id;
      winnerId = walkoverPlayerId === match.player1_id ? match.player2_id : match.player1_id;

      // Walkover skorunu 6-0, 6-0 olarak kaydet
      const winnerIsPlayer1 = winnerId === match.player1_id;
      const player1Set1 = winnerIsPlayer1 ? 6 : 0;
      const player2Set1 = winnerIsPlayer1 ? 0 : 6;
      const player1Set2 = winnerIsPlayer1 ? 6 : 0;
      const player2Set2 = winnerIsPlayer1 ? 0 : 6;

      // Insert walkover score with 6-0, 6-0
      await db.runAsync(`
        INSERT INTO match_scores (
          match_id,
          player1_set1,
          player2_set1,
          player1_set2,
          player2_set2,
          winner_id,
          walkover_player_id,
          submitted_by,
          approval_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `, [id, player1Set1, player2Set1, player1Set2, player2Set2, winnerId, walkoverPlayerId, userId]);

      // Update standings
      await updateStandings(id, scoreData);
    } else {
      // Calculate winner
      const p1Set1 = parseInt(scoreData.player1_set1);
      const p2Set1 = parseInt(scoreData.player2_set1);
      const p1Set2 = parseInt(scoreData.player1_set2);
      const p2Set2 = parseInt(scoreData.player2_set2);

      let p1Sets = 0;
      let p2Sets = 0;

      if (p1Set1 > p2Set1) p1Sets++; else p2Sets++;
      if (p1Set2 > p2Set2) p1Sets++; else p2Sets++;

      if (scoreData.super_tiebreak_p1 && scoreData.super_tiebreak_p2) {
        if (parseInt(scoreData.super_tiebreak_p1) > parseInt(scoreData.super_tiebreak_p2)) {
          p1Sets++;
        } else {
          p2Sets++;
        }
      }

      winnerId = p1Sets > p2Sets ? match.player1_id : match.player2_id;

      // Insert score
      await db.runAsync(`
        INSERT INTO match_scores (
          match_id,
          player1_set1,
          player2_set1,
          player1_set2,
          player2_set2,
          super_tiebreak_p1,
          super_tiebreak_p2,
          winner_id,
          submitted_by,
          approval_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        id,
        scoreData.player1_set1,
        scoreData.player2_set1,
        scoreData.player1_set2,
        scoreData.player2_set2,
        scoreData.super_tiebreak_p1 || null,
        scoreData.super_tiebreak_p2 || null,
        winnerId,
        userId
      ]);
    }

    res.json({ message: 'Score submitted successfully. Waiting for opponent approval.' });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Approve match score
router.put('/:id/score/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get match and score
    const match = await db.getAsync(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const score = await db.getAsync(
      'SELECT * FROM match_scores WHERE match_id = ?',
      [id]
    );

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    if (score.approval_status === 'approved') {
      return res.status(400).json({ error: 'Score already approved' });
    }

    // Verify user is from the opponent team or admin
    // Determine which team submitted the score
    const submitterInTeam1 = score.submitted_by === match.player1_id ||
                             (match.player1_partner_id && score.submitted_by === match.player1_partner_id);
    const submitterInTeam2 = score.submitted_by === match.player2_id ||
                             (match.player2_partner_id && score.submitted_by === match.player2_partner_id);

    // Check if current user is in opponent team
    const userInTeam1 = userId === match.player1_id || (match.player1_partner_id && userId === match.player1_partner_id);
    const userInTeam2 = userId === match.player2_id || (match.player2_partner_id && userId === match.player2_partner_id);

    const isOpponent = (submitterInTeam1 && userInTeam2) || (submitterInTeam2 && userInTeam1);

    if (!isOpponent && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only someone from the opponent team or admin can approve the score' });
    }

    // Approve score
    await db.runAsync(
      'UPDATE match_scores SET approval_status = ?, approved_by = ? WHERE match_id = ?',
      ['approved', userId, id]
    );

    // Update standings
    const scoreData = {
      is_walkover: !!score.walkover_player_id,
      walkover_player_id: score.walkover_player_id,
      player1_set1: score.player1_set1,
      player2_set1: score.player2_set1,
      player1_set2: score.player1_set2,
      player2_set2: score.player2_set2,
      super_tiebreak_p1: score.super_tiebreak_p1,
      super_tiebreak_p2: score.super_tiebreak_p2
    };

    await updateStandings(id, scoreData);

    res.json({ message: 'Score approved successfully' });
  } catch (error) {
    console.error('Error approving score:', error);
    res.status(500).json({ error: 'Failed to approve score' });
  }
});

export default router;