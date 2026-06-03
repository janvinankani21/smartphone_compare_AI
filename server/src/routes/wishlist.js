const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. Get User Wishlist
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const sql = `
      SELECT p.*, b.name as brand_name 
      FROM wishlist w
      JOIN phones p ON w.phone_id = p.id
      JOIN brands b ON p.brand_id = b.id
      WHERE w.user_id = $1
      ORDER BY w.id DESC
    `;
    const result = await query(sql, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch wishlist error:', err);
    res.status(500).json({ error: 'Failed to retrieve wishlist items' });
  }
});

// 2. Toggle Wishlist (Add if not exists, remove if exists)
router.post('/', authenticateToken, async (req, res) => {
  const { phoneId } = req.body;
  const userId = req.user.id;

  if (!phoneId) {
    return res.status(400).json({ error: 'Phone ID is required' });
  }

  try {
    // Check if phone exists
    const phoneCheck = await query('SELECT id FROM phones WHERE id = $1', [phoneId]);
    if (phoneCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    const check = await query('SELECT id FROM wishlist WHERE user_id = $1 AND phone_id = $2', [userId, phoneId]);
    
    if (check.rows.length > 0) {
      // Remove
      await query('DELETE FROM wishlist WHERE user_id = $1 AND phone_id = $2', [userId, phoneId]);
      res.json({ added: false, message: 'Removed from wishlist' });
    } else {
      // Add
      await query('INSERT INTO wishlist (user_id, phone_id) VALUES ($1, $2)', [userId, phoneId]);
      res.json({ added: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    res.status(500).json({ error: 'Failed to toggle wishlist state' });
  }
});

module.exports = router;
