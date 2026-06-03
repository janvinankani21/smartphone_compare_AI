const express = require('express');
const router = express.Router();
const { query, dbType } = require('../db');
const { authenticateToken, adminOnly } = require('../middleware/auth');

// All routes here require admin privileges
router.use(authenticateToken);
router.use(adminOnly);

// 1. Moderate Reviews: Get all reviews (approved & unapproved)
router.get('/reviews', async (req, res) => {
  try {
    const sql = `
      SELECT r.*, p.model as phone_model, u.full_name as user_name, u.email as user_email
      FROM reviews r
      JOIN phones p ON r.phone_id = p.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.is_approved ASC, r.created_at DESC
    `;
    const result = await query(sql);
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
    console.error('Error fetching admin reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve moderation list' });
  }
});

// 2. Moderate Reviews: Approve/Disapprove Review
router.put('/reviews/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;

  try {
    const appVal = dbType === 'postgres' 
      ? (is_approved ? true : false) 
      : (is_approved ? 1 : 0);

    await query('UPDATE reviews SET is_approved = $1 WHERE id = $2', [appVal, id]);
    res.json({ success: true, message: `Review approval status updated` });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// 3. Moderate Reviews: Delete Review
router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// 4. Smartphone CRUD: Add Phone
router.post('/phones', async (req, res) => {
  const {
    brand_id, model, launch_date, price_inr, display_size, display_type,
    refresh_rate, resolution, processor, gpu, ram_gb, storage_gb,
    expandable_storage, rear_camera_spec, front_camera_spec,
    battery_capacity, charging_speed, wireless_charging, android_version,
    software_updates_years, weight_g, build_quality, ip_rating,
    network_support, image_url, pros, cons
  } = req.body;

  if (!brand_id || !model || !price_inr || !processor) {
    return res.status(400).json({ error: 'Brand ID, Model, Price, and Processor are required' });
  }

  // Calculate scores dynamically based on the specifications provided
  const performance_score = ram_gb >= 12 ? 95 : (ram_gb >= 8 ? 85 : 70);
  const display_score = refresh_rate >= 120 ? (display_type.includes('AMOLED') || display_type.includes('OLED') ? 95 : 85) : 70;
  const battery_score = battery_capacity >= 5000 ? (charging_speed >= 80 ? 95 : (charging_speed >= 45 ? 90 : 80)) : 75;
  const camera_score = rear_camera_spec.includes('200MP') ? 96 : (rear_camera_spec.includes('50MP') ? 88 : 75);
  const gaming_score = Math.round((performance_score * 0.7) + (display_score * 0.3));
  const value_for_money_score = price_inr < 30000 ? 90 : (price_inr < 60000 ? 80 : 70);
  const overall_score = Math.round((performance_score + display_score + battery_score + camera_score + gaming_score + value_for_money_score) / 6);

  try {
    const expStorage = dbType === 'postgres' ? (expandable_storage ? true : false) : (expandable_storage ? 1 : 0);
    const wireCharging = dbType === 'postgres' ? (wireless_charging ? true : false) : (wireless_charging ? 1 : 0);
    
    const insertSql = `
      INSERT INTO phones (
        brand_id, model, launch_date, price_inr, display_size, display_type,
        refresh_rate, resolution, processor, gpu, ram_gb, storage_gb,
        expandable_storage, rear_camera_spec, front_camera_spec,
        battery_capacity, charging_speed, wireless_charging, android_version,
        software_updates_years, weight_g, build_quality, ip_rating,
        network_support, overall_score, performance_score, camera_score,
        battery_score, gaming_score, display_score, value_for_money_score,
        pros, cons, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      )
    `;

    const seedPros = JSON.stringify(pros || ["Great design", "Vibrant screen"]);
    const seedCons = JSON.stringify(cons || ["Charger might be sold separately"]);
    const imgUrl = image_url || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60";

    const insertResult = await query(insertSql, [
      parseInt(brand_id), model, launch_date || '2024-01-01', parseInt(price_inr), parseFloat(display_size) || 6.5, display_type || 'AMOLED',
      parseInt(refresh_rate) || 120, resolution || 'FHD+', processor, gpu || 'Adreno', parseInt(ram_gb) || 8, parseInt(storage_gb) || 128,
      expStorage, rear_camera_spec || '50MP Main', front_camera_spec || '16MP',
      parseInt(battery_capacity) || 5000, parseInt(charging_speed) || 33, wireCharging, android_version || 'Android 14',
      parseInt(software_updates_years) || 3, parseInt(weight_g) || 190, build_quality || 'Glass front, Plastic frame', ip_rating || 'IP54',
      network_support || '5G, Wi-Fi', overall_score, performance_score, camera_score,
      battery_score, gaming_score, display_score, value_for_money_score,
      seedPros, seedCons, imgUrl
    ]);

    let newPhoneId;
    if (dbType === 'postgres') {
      const idRes = await query("SELECT id FROM phones WHERE model = $1", [model]);
      newPhoneId = idRes.rows[0].id;
    } else {
      newPhoneId = insertResult.insertId;
    }

    // Set trending
    await query('INSERT INTO trending_data (phone_id, views_count, comparison_count) VALUES ($1, 0, 0)', [newPhoneId]);

    res.status(201).json({ success: true, message: 'Smartphone added successfully', phoneId: newPhoneId });
  } catch (err) {
    console.error('Error inserting smartphone:', err);
    res.status(500).json({ error: 'Failed to create smartphone specification record' });
  }
});

// 5. Smartphone CRUD: Edit Phone
router.put('/phones/:id', async (req, res) => {
  const { id } = req.params;
  const {
    price_inr, ram_gb, storage_gb, launch_date, processor, display_type,
    refresh_rate, battery_capacity, charging_speed, image_url
  } = req.body;

  try {
    const existingRes = await query('SELECT * FROM phones WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    const p = existingRes.rows[0];

    const newPrice = price_inr ? parseInt(price_inr) : p.price_inr;
    const newRam = ram_gb ? parseInt(ram_gb) : p.ram_gb;
    const newStorage = storage_gb ? parseInt(storage_gb) : p.storage_gb;
    const newDate = launch_date || p.launch_date;
    const newProc = processor || p.processor;
    const newDisp = display_type || p.display_type;
    const newRefresh = refresh_rate ? parseInt(refresh_rate) : p.refresh_rate;
    const newBattery = battery_capacity ? parseInt(battery_capacity) : p.battery_capacity;
    const newCharging = charging_speed ? parseInt(charging_speed) : p.charging_speed;
    const newImg = image_url || p.image_url;

    // Recalculate scores
    const performance_score = newRam >= 12 ? 95 : (newRam >= 8 ? 85 : 70);
    const display_score = newRefresh >= 120 ? (newDisp.includes('AMOLED') || newDisp.includes('OLED') ? 95 : 85) : 70;
    const battery_score = newBattery >= 5000 ? (newCharging >= 80 ? 95 : (newCharging >= 45 ? 90 : 80)) : 75;
    const gaming_score = Math.round((performance_score * 0.7) + (display_score * 0.3));
    const value_for_money_score = newPrice < 30000 ? 90 : (newPrice < 60000 ? 80 : 70);
    const overall_score = Math.round((performance_score + display_score + battery_score + gaming_score + value_for_money_score) / 5);

    const updateSql = `
      UPDATE phones 
      SET price_inr = $1, ram_gb = $2, storage_gb = $3, launch_date = $4,
          processor = $5, display_type = $6, refresh_rate = $7, battery_capacity = $8,
          charging_speed = $9, image_url = $10, overall_score = $11, performance_score = $12,
          battery_score = $13, gaming_score = $14, display_score = $15, value_for_money_score = $16
      WHERE id = $17
    `;
    await query(updateSql, [
      newPrice, newRam, newStorage, newDate, newProc, newDisp, newRefresh, newBattery,
      newCharging, newImg, overall_score, performance_score, battery_score, gaming_score,
      display_score, value_for_money_score, id
    ]);

    res.json({ success: true, message: 'Smartphone updated successfully' });
  } catch (err) {
    console.error('Error editing phone specs:', err);
    res.status(500).json({ error: 'Failed to update smartphone parameters' });
  }
});

// 6. Smartphone CRUD: Delete Phone
router.delete('/phones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM phones WHERE id = $1', [id]);
    res.json({ success: true, message: 'Phone deleted from catalog' });
  } catch (err) {
    console.error('Error deleting phone:', err);
    res.status(500).json({ error: 'Failed to delete smartphone from database' });
  }
});

// 7. Get Analytics for Admin Panel
router.get('/analytics', async (req, res) => {
  try {
    const userRes = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['user']);
    const phoneRes = await query('SELECT COUNT(*) as count FROM phones');
    const reviewRes = await query('SELECT COUNT(*) as count FROM reviews WHERE is_approved = $1', [dbType === 'postgres' ? false : 0]);

    // Most viewed top 5 (Using views count directly to preserve user comparison privacy)
    const mostComparedRes = await query(`
      SELECT p.model, b.name as brand_name, t.views_count 
      FROM trending_data t
      JOIN phones p ON t.phone_id = p.id
      JOIN brands b ON p.brand_id = b.id
      ORDER BY t.views_count DESC
      LIMIT 5
    `);

    // Top brands share
    const brandShareRes = await query(`
      SELECT b.name as brand, COUNT(p.id) as count
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      GROUP BY b.name
    `);

    // Mock Monthly Activity Data for Recharts (Using views instead of comparisons to preserve privacy)
    const activityData = [
      { name: 'Jan', views: 4500, searches: 1200, signups: 80 },
      { name: 'Feb', views: 6000, searches: 1400, signups: 95 },
      { name: 'Mar', views: 8000, searches: 2100, signups: 140 },
      { name: 'Apr', views: 9500, searches: 2600, signups: 165 },
      { name: 'May', views: 12000, searches: 3500, signups: 210 },
      { name: 'Jun', views: 15400, searches: 4200, signups: 280 }
    ];

    res.json({
      stats: {
        totalUsers: parseInt(userRes.rows[0].count || userRes.rows[0]['COUNT(*)'] || 0),
        totalPhones: parseInt(phoneRes.rows[0].count || phoneRes.rows[0]['COUNT(*)'] || 0),
        pendingReviews: parseInt(reviewRes.rows[0].count || reviewRes.rows[0]['COUNT(*)'] || 0)
      },
      mostCompared: mostComparedRes.rows,
      brandDistribution: brandShareRes.rows.map(row => ({
        name: row.brand,
        value: parseInt(row.count)
      })),
      monthlyGrowth: activityData
    });

  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve admin analytics' });
  }
});

module.exports = router;
