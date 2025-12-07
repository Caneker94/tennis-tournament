import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get active sponsors (public)
router.get('/', async (req, res) => {
  try {
    const sponsors = await db.allAsync(
      'SELECT * FROM sponsors WHERE active = 1 ORDER BY display_order, id'
    );
    res.json(sponsors);
  } catch (error) {
    console.error('Get sponsors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
