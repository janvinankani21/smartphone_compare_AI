const express = require('express');
const router = express.Router();
const { query, dbType } = require('../db');
const { generateAIResponse } = require('../utils/ai');

// 1. Get All Phones with Advanced Filtering
router.get('/', async (req, res) => {
  const {
    brand,
    minPrice,
    maxPrice,
    processor,
    ram,
    storage,
    battery,
    refreshRate,
    amoled,
    nfc,
    support5g,
    wirelessCharging
  } = req.query;

  let sql = `
    SELECT p.*, b.name as brand_name, b.logo_url as brand_logo 
    FROM phones p
    JOIN brands b ON p.brand_id = b.id
    WHERE 1=1
  `;
  const params = [];
  let paramIdx = 1;

  if (brand) {
    sql += ` AND b.name = $${paramIdx++}`;
    params.push(brand);
  }
  if (minPrice) {
    sql += ` AND p.price_inr >= $${paramIdx++}`;
    params.push(parseInt(minPrice));
  }
  if (maxPrice) {
    sql += ` AND p.price_inr <= $${paramIdx++}`;
    params.push(parseInt(maxPrice));
  }
  if (processor) {
    sql += ` AND p.processor LIKE $${paramIdx++}`;
    params.push(`%${processor}%`);
  }
  if (ram) {
    sql += ` AND p.ram_gb >= $${paramIdx++}`;
    params.push(parseInt(ram));
  }
  if (storage) {
    sql += ` AND p.storage_gb >= $${paramIdx++}`;
    params.push(parseInt(storage));
  }
  if (battery) {
    sql += ` AND p.battery_capacity >= $${paramIdx++}`;
    params.push(parseInt(battery));
  }
  if (refreshRate) {
    sql += ` AND p.refresh_rate >= $${paramIdx++}`;
    params.push(parseInt(refreshRate));
  }
  if (amoled === 'true') {
    sql += ` AND (p.display_type LIKE $${paramIdx++} OR p.display_type LIKE $${paramIdx++})`;
    params.push('%AMOLED%');
    params.push('%OLED%');
  }
  if (support5g === 'true') {
    sql += ` AND p.network_support LIKE $${paramIdx++}`;
    params.push('%5G%');
  }
  if (nfc === 'true') {
    sql += ` AND p.network_support LIKE $${paramIdx++}`;
    params.push('%NFC%');
  }
  if (wirelessCharging === 'true') {
    if (dbType === 'postgres') {
      sql += ` AND p.wireless_charging = TRUE`;
    } else {
      sql += ` AND p.wireless_charging = 1`;
    }
  }

  sql += ' ORDER BY p.overall_score DESC';

  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching filtered phones:', err);
    res.status(500).json({ error: 'Failed to retrieve phone catalog' });
  }
});

// 2. Autocomplete Instant Search
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json([]);
  }

  try {
    const sql = `
      SELECT p.id, p.model, p.price_inr, p.image_url, b.name as brand_name 
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.model LIKE $1 OR b.name LIKE $2
      LIMIT 6
    `;
    const result = await query(sql, [`%${q}%`, `%${q}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search query failed' });
  }
});

// 3. Get Trending and Most Compared Phones
router.get('/trending', async (req, res) => {
  try {
    // Top viewed
    const viewedSql = `
      SELECT p.*, b.name as brand_name, t.views_count, t.comparison_count
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      JOIN trending_data t ON p.id = t.phone_id
      ORDER BY t.views_count DESC
      LIMIT 4
    `;
    const viewedRes = await query(viewedSql);

    // Top compared (represented by high overall hardware rating)
    const comparedSql = `
      SELECT p.*, b.name as brand_name, t.views_count, t.comparison_count
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      JOIN trending_data t ON p.id = t.phone_id
      ORDER BY p.overall_score DESC
      LIMIT 4
    `;
    const comparedRes = await query(comparedSql);

    res.json({
      mostViewed: viewedRes.rows,
      mostCompared: comparedRes.rows
    });
  } catch (err) {
    console.error('Trending fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve trending statistics' });
  }
});

// 4. Best Phone Finder Router
router.post('/finder', async (req, res) => {
  const { budget, usages } = req.body;
  
  if (!budget || !usages || !Array.isArray(usages)) {
    return res.status(400).json({ error: 'Budget category and usage criteria list are required.' });
  }

  // Parse budget range
  let minBudget = 0;
  let maxBudget = 200000;
  
  if (budget === 'under10k') maxBudget = 10000;
  else if (budget === 'under15k') { minBudget = 10000; maxBudget = 15000; }
  else if (budget === 'under20k') { minBudget = 15000; maxBudget = 20000; }
  else if (budget === 'under30k') { minBudget = 20000; maxBudget = 30000; }
  else if (budget === 'premium') { minBudget = 30000; }

  try {
    // Retrieve all candidates within the price range
    const sql = `
      SELECT p.*, b.name as brand_name 
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.price_inr >= $1 AND p.price_inr <= $2
    `;
    const result = await query(sql, [minBudget, maxBudget]);
    const candidates = result.rows;

    if (candidates.length === 0) {
      return res.json({
        recommendations: [],
        reasoning: "We couldn't find any phones directly in this specific price range in our database. Try expanding your budget parameters!"
      });
    }

    // Rank candidates by their scores in relation to selected usages
    // Usage mappings: Gaming -> gaming_score, Photography/Content Creation -> camera_score, Video Editing -> performance_score, Office Use/Student -> battery_score & display_score
    const scoredCandidates = candidates.map(phone => {
      let matchScore = 0;
      usages.forEach(use => {
        if (use === 'Gaming') matchScore += phone.gaming_score;
        else if (use === 'Photography' || use === 'Content Creation') matchScore += phone.camera_score;
        else if (use === 'Video Editing') matchScore += phone.performance_score;
        else if (use === 'Student' || use === 'Office Use') matchScore += (phone.battery_score + phone.display_score) / 2;
      });
      // Normalize by number of usages
      const averageMatchScore = usages.length > 0 ? (matchScore / usages.length) : phone.overall_score;
      return { ...phone, matchScore: Math.round(averageMatchScore) };
    });

    // Sort by match score desc
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    const topPicks = scoredCandidates.slice(0, 3);

    // Dynamic AI summary for the recommendations
    let localSummary = `### AI Recommendation Engine Summary\n\nFor a budget of **${budget.toUpperCase()}** focusing on **${usages.join(', ')}**, we analyzed the specifications and benchmarks of all available models. Here are the top suggestions:\n\n`;
    
    topPicks.forEach((p, idx) => {
      localSummary += `${idx + 1}. **${p.brand_name} ${p.model}** (₹${p.price_inr.toLocaleString()}):\n`;
      localSummary += `   - **Score Match:** ${p.matchScore}/100\n`;
      localSummary += `   - **Strengths:** Fits your user profile with an overall rating of **${p.overall_score}/100**. Features a **${p.processor}** processor, a high-quality **${p.display_type}** display, and a robust **${p.battery_capacity}mAh** battery.\n\n`;
    });

    localSummary += `**Recommended Verdict:** We highly recommend selecting the **${topPicks[0].brand_name} ${topPicks[0].model}** as it provides the highest spec alignment for your specific activities.`;

    const aiPrompt = `Recommend the best phone from the following candidates: ${JSON.stringify(topPicks.map(p => ({
      brand: p.brand_name,
      model: p.model,
      price: p.price_inr,
      processor: p.processor,
      display: p.display_type,
      overall_score: p.overall_score,
      performance_score: p.performance_score,
      camera_score: p.camera_score,
      battery_score: p.battery_score,
      gaming_score: p.gaming_score
    })))} based on budget segment: ${budget} and usage categories: ${usages.join(', ')}.`;
    
    const reasoning = await generateAIResponse(aiPrompt, "You are a professional smartphone advisor. Provide a summary highlighting the strengths, weaknesses, and a final recommended smartphone based on the provided JSON data.");

    res.json({
      recommendations: topPicks,
      reasoning: reasoning || localSummary
    });

  } catch (err) {
    console.error('Finder error:', err);
    res.status(500).json({ error: 'Failed to query Best Phone Finder' });
  }
});

// 5. Compare Multiple Smartphones & Generate AI Recommendations
router.get('/compare', async (req, res) => {
  const { ids } = req.query; // Expecting comma-separated ids e.g. "1,2,3"

  if (!ids) {
    return res.status(400).json({ error: 'Smartphone IDs are required' });
  }

  const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
  if (idList.length === 0) {
    return res.status(400).json({ error: 'Invalid smartphone IDs list' });
  }

  try {
    // Generate parameter list $1, $2, etc.
    const placeHolders = idList.map((_, i) => `$${i + 1}`).join(',');
    const sql = `
      SELECT p.*, b.name as brand_name, b.logo_url as brand_logo 
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id IN (${placeHolders})
    `;
    const result = await query(sql, idList);
    const phones = result.rows;

    if (phones.length === 0) {
      return res.status(404).json({ error: 'Phones not found' });
    }

    // Comparison counter logging removed for user privacy preservation

    // Call AI engine to compare
    const aiPrompt = `Compare the following phones: ${JSON.stringify(phones.map(p => ({
      id: p.id,
      brand_name: p.brand_name,
      model: p.model,
      price_inr: p.price_inr,
      processor: p.processor,
      display_size: p.display_size,
      display_type: p.display_type,
      refresh_rate: p.refresh_rate,
      overall_score: p.overall_score,
      performance_score: p.performance_score,
      camera_score: p.camera_score,
      battery_score: p.battery_score,
      gaming_score: p.gaming_score,
      value_for_money_score: p.value_for_money_score,
      battery_capacity: p.battery_capacity,
      charging_speed: p.charging_speed,
      rear_camera_spec: p.rear_camera_spec
    })))}`;

    const aiRecommendation = await generateAIResponse(
      aiPrompt,
      "You are a professional hardware reviewer. Contrast the selected phones, list the key advantages of each, and output a clear 'Recommended Choice' with reasoning."
    );

    res.json({
      phones,
      aiRecommendation
    });
  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: 'Server error during comparison execution' });
  }
});

// 6. Get Single Phone Details (Increments Views)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT p.*, b.name as brand_name, b.logo_url as brand_logo 
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id = $1
    `;
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    const phone = result.rows[0];

    // Try parsing pros/cons JSON string
    try {
      phone.pros = typeof phone.pros === 'string' ? JSON.parse(phone.pros) : phone.pros;
      phone.cons = typeof phone.cons === 'string' ? JSON.parse(phone.cons) : phone.cons;
    } catch (pe) {
      console.warn("Failed to parse pros/cons JSON for phone ID:", id, pe);
      phone.pros = [];
      phone.cons = [];
    }

    // Increment view count asynchronously
    query('UPDATE trending_data SET views_count = views_count + 1 WHERE phone_id = $1', [id]).catch(err => {
      console.error('Failed to update views count:', err);
    });

    // Automatically suggest related comparisons (similar price range +/- 20% or same brand)
    const priceBoundMin = Math.round(phone.price_inr * 0.8);
    const priceBoundMax = Math.round(phone.price_inr * 1.2);
    
    const recommendationsSql = `
      SELECT p.id, p.model, p.price_inr, p.image_url, b.name as brand_name 
      FROM phones p
      JOIN brands b ON p.brand_id = b.id
      WHERE p.id != $1 AND (p.brand_id = $2 OR (p.price_inr >= $3 AND p.price_inr <= $4))
      LIMIT 3
    `;
    const relatedRes = await query(recommendationsSql, [
      phone.id,
      phone.brand_id,
      priceBoundMin,
      priceBoundMax
    ]);

    res.json({
      phone,
      relatedComparisons: relatedRes.rows
    });

  } catch (err) {
    console.error('Error retrieving phone details:', err);
    res.status(500).json({ error: 'Database error fetching phone information' });
  }
});

module.exports = router;
