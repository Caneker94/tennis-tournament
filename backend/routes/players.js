import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// GET /api/players/:id - Get player profile and matches
router.get('/:id', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const overrideGroupId = req.query.groupId ? parseInt(req.query.groupId) : null;

    // Get player info
    const player = await db.getAsync(`
      SELECT
        u.id, u.full_name, u.profile_photo, u.group_id,
        c.name as category, c.gender,
        g.name as group_name
      FROM users u
      LEFT JOIN groups g ON u.group_id = g.id
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE u.id = ? AND u.role = 'player'
    `, [playerId]);

    if (!player) {
      return res.status(404).json({ error: 'Oyuncu bulunamadı' });
    }

    // Use override groupId if provided, otherwise use player's primary group_id
    const groupId = overrideGroupId || player.group_id;

    // Determine category based on the group being used
    let categoryName = player.category;
    let categoryGender = player.gender;
    let groupName = player.group_name;

    if (overrideGroupId) {
      // Get the override group's category
      const overrideGroup = await db.getAsync(`
        SELECT g.name as group_name, c.name as category_name, c.gender
        FROM groups g
        JOIN categories c ON g.category_id = c.id
        WHERE g.id = ?
      `, [overrideGroupId]);

      if (overrideGroup) {
        categoryName = overrideGroup.category_name;
        categoryGender = overrideGroup.gender;
        groupName = overrideGroup.group_name;
      }
    }

    const isMixCategory = categoryName && categoryName.toLowerCase().includes('mix');

    // MIX kategorisindeyse partner olarak oynadığı maçları da göster
    // Diğer kategorilerdeyse (ELITE, MASTER, RISING) sadece main player olarak oynadığı maçları göster
    const whereClause = isMixCategory
      ? '(m.player1_id = ? OR m.player2_id = ? OR m.player1_partner_id = ? OR m.player2_partner_id = ?)'
      : '(m.player1_id = ? OR m.player2_id = ?)';

    const params = isMixCategory
      ? [playerId, playerId, playerId, playerId, groupId]
      : [playerId, playerId, groupId];

    const matches = await db.allAsync(`
      SELECT
        m.id, m.match_date, m.week_number, m.status, m.venue, m.is_doubles,
        p1.full_name as player1_name,
        p2.full_name as player2_name,
        p1p.full_name as player1_partner_name,
        p2p.full_name as player2_partner_name,
        m.player1_id, m.player2_id, m.player1_partner_id, m.player2_partner_id,
        ms.player1_set1, ms.player2_set1, ms.player1_set2, ms.player2_set2,
        ms.super_tiebreak_p1, ms.super_tiebreak_p2, ms.winner_id
      FROM matches m
      LEFT JOIN users p1 ON m.player1_id = p1.id
      LEFT JOIN users p2 ON m.player2_id = p2.id
      LEFT JOIN users p1p ON m.player1_partner_id = p1p.id
      LEFT JOIN users p2p ON m.player2_partner_id = p2p.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      WHERE ${whereClause}
        AND m.group_id = ?
      ORDER BY m.week_number, m.match_date, m.match_time
    `, params);

    // Format opponent names for each match
    const formattedMatches = matches.map(match => {
      // Determine if player is on team 1 or team 2
      const isTeam1 = match.player1_id === playerId || match.player1_partner_id === playerId;

      let opponentName;
      let opponentId;

      if (isTeam1) {
        // Player is on team 1, opponent is team 2
        opponentName = match.is_doubles && match.player2_partner_name
          ? `${match.player2_name} / ${match.player2_partner_name}`
          : match.player2_name;
        opponentId = match.player2_id;
      } else {
        // Player is on team 2, opponent is team 1
        opponentName = match.is_doubles && match.player1_partner_name
          ? `${match.player1_name} / ${match.player1_partner_name}`
          : match.player1_name;
        opponentId = match.player1_id;
      }

      return {
        id: match.id,
        match_date: match.match_date,
        week_number: match.week_number,
        status: match.status,
        venue: match.venue,
        opponent_name: opponentName,
        opponent_id: opponentId,
        player1_set1: match.player1_set1,
        player2_set1: match.player2_set1,
        player1_set2: match.player1_set2,
        player2_set2: match.player2_set2,
        super_tiebreak_p1: match.super_tiebreak_p1,
        super_tiebreak_p2: match.super_tiebreak_p2,
        winner_id: match.winner_id
      };
    });

    // Get player statistics for the specific group
    const stats = await db.getAsync(`
      SELECT points, matches_won, matches_lost, walkovers, games_won, games_total
      FROM standings
      WHERE user_id = ? AND group_id = ?
    `, [playerId, groupId]);

    // Format category display - for MIX category, don't show gender prefix
    let categoryDisplay;
    if (categoryName && categoryName.toLowerCase().includes('mix')) {
      categoryDisplay = categoryName;
    } else if (categoryName) {
      categoryDisplay = `${categoryGender === 'male' ? 'Erkek' : 'Kadın'} - ${categoryName}`;
    } else {
      categoryDisplay = categoryGender === 'male' ? 'Erkek' : 'Kadın';
    }

    res.json({
      player: {
        ...player,
        category: categoryDisplay,
        group_name: groupName
      },
      matches: formattedMatches || [],
      stats: stats || { points: 0, matches_won: 0, matches_lost: 0, walkovers: 0, games_won: 0, games_total: 0 }
    });
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({ error: 'Profil bilgileri alınamadı' });
  }
});

// POST /api/players/profile/photo - Upload profile photo
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fotoğraf yüklenmedi' });
    }

    const userId = req.user.id; // Fixed: was req.user.userId
    const photoPath = '/uploads/profiles/' + req.file.filename;

    console.log('📸 Photo upload - userId:', userId, 'photoPath:', photoPath);

    // Get old photo to delete it
    const user = await db.getAsync('SELECT profile_photo FROM users WHERE id = ?', [userId]);
    console.log('📸 Current user photo:', user?.profile_photo);

    if (user && user.profile_photo) {
      const oldPhotoPath = path.join(__dirname, '..', user.profile_photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update user's profile photo
    console.log('📸 Updating database...');
    const result = await db.runAsync('UPDATE users SET profile_photo = ? WHERE id = ?', [photoPath, userId]);
    console.log('📸 Database update result:', result);

    // Verify the update
    const updatedUser = await db.getAsync('SELECT profile_photo FROM users WHERE id = ?', [userId]);
    console.log('📸 After update - profile_photo:', updatedUser?.profile_photo);

    res.json({
      success: true,
      message: '📸 DEBUG: Profil fotoğrafı güncellendi (v2)',
      photoPath: photoPath,
      debug: {
        userId,
        updated: updatedUser?.profile_photo
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Fotoğraf yüklenemedi' });
  }
});

// DELETE /api/players/profile/photo - Delete profile photo
router.delete('/profile/photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get photo to delete it
    const user = await db.getAsync('SELECT profile_photo FROM users WHERE id = ?', [userId]);
    if (user && user.profile_photo) {
      const photoPath = path.join(__dirname, '..', user.profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Remove photo from database
    await db.runAsync('UPDATE users SET profile_photo = NULL WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'Profil fotoğrafı silindi'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Fotoğraf silinemedi' });
  }
});

export default router;
