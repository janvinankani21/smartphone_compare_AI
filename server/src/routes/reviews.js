const express = require('express');
const router = express.Router();
const { query, dbType } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. Get Approved Reviews for a Phone
router.get('/:phoneId', async (req, res) => {
  const { phoneId } = req.params;

  try {
    const isApprovedVal = dbType === 'postgres' ? true : 1;
    const sql = `
      SELECT r.*, u.full_name as user_name, u.avatar_url as user_avatar 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.phone_id = $1 AND r.is_approved = $2
      ORDER BY r.created_at DESC
    `;
    const result = await query(sql, [phoneId, isApprovedVal]);
    
    // Parse image_urls
    const reviews = result.rows.map(row => {
      try {
        row.image_urls = typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls;
      } catch (e) {
        row.image_urls = [];
      }
      return row;
    });

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve phone reviews' });
  }
});

// 2. Submit Review (Requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  const { phoneId, rating, comment, image_urls } = req.body;
  const userId = req.user.id;

  if (!phoneId || !rating || !comment) {
    return res.status(400).json({ error: 'Phone ID, rating (1-5), and comment are required' });
  }

  const ratingVal = parseInt(rating);
  if (ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
  }

  try {
    // Check if phone exists
    const phoneCheck = await query('SELECT id FROM phones WHERE id = $1', [phoneId]);
    if (phoneCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    const imagesJson = JSON.stringify(image_urls || []);
    const isApprovedVal = dbType === 'postgres' ? false : 0; // Default: unapproved, requires admin approval

    await query(
      `INSERT INTO reviews (phone_id, user_id, rating, comment, image_urls, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [phoneId, userId, ratingVal, comment, imagesJson, isApprovedVal]
    );

    res.status(201).json({ 
      message: 'Review submitted successfully. It will be visible once approved by an administrator.' 
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

module.exports = router;
