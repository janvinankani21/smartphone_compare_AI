const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { generateAIResponse } = require('../utils/ai');

// POST /api/chat
router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Basic entity extraction from prompt to inject phone context
    // Fetch all phones to match against user text
    const phonesRes = await query('SELECT p.id, p.model, b.name as brand_name, p.price_inr, p.processor, p.overall_score, p.camera_score, p.gaming_score, p.battery_score FROM phones p JOIN brands b ON p.brand_id = b.id');
    const allPhones = phonesRes.rows;

    let matchedPhones = [];
    const lowerMessage = message.toLowerCase();

    allPhones.forEach(phone => {
      const modelLower = phone.model.toLowerCase();
      const brandLower = phone.brand_name.toLowerCase();

      // Look for model name or brand + model name in user message
      if (lowerMessage.includes(modelLower) || 
         (lowerMessage.includes(brandLower) && lowerMessage.includes(modelLower.split(' ')[0]))) {
        matchedPhones.push(phone);
      }
    });

    let contextString = '';
    if (matchedPhones.length > 0) {
      contextString = `The user is asking about the following phone(s) from our database:
      ${JSON.stringify(matchedPhones.map(p => ({
        name: `${p.brand_name} ${p.model}`,
        price: `₹${p.price_inr.toLocaleString()}`,
        processor: p.processor,
        scores: {
          overall: p.overall_score,
          camera: p.camera_score,
          gaming: p.gaming_score,
          battery: p.battery_score
        }
      })))}
      Please reference their exact specifications, scores, and details to answer.`;
    }

    // System instruction for general tech advisory
    const systemInstruction = `You are the Smartphone Compare AI Platform tech advisor.
    Your goal is to help users compare smartphones, explain technical details simply, and recommend the best phone based on their budget and preference.
    Always format your responses with clean, premium Markdown: use bolding, bullet points, headers, and comparison tables if helpful.
    Keep answers engaging, structured, and informative.
    
    ${contextString}`;

    // Generate AI response
    const reply = await generateAIResponse(message, systemInstruction);

    res.json({ reply });
  } catch (err) {
    console.error('Chat routing error:', err);
    res.status(500).json({ error: 'AI engine failed to process the request' });
  }
});

module.exports = router;
