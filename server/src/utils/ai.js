const { query } = require('../db');

// Calls Gemini API if configured, otherwise falls back to the dynamic spec-comparison generator
async function generateAIResponse(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: systemInstruction ? `${systemInstruction}\n\nUser Request:\n${prompt}` : prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error("Gemini API call failed, falling back to local expert system:", error);
    }
  }
  
  // Local Rule-Based Expert System (Fallback)
  return fallbackAIResponse(prompt, systemInstruction);
}

// Fallback AI recommendation system based on phone specs
function fallbackAIResponse(prompt, systemInstruction) {
  // If the instruction indicates comparison
  if (systemInstruction.includes('compare') || prompt.includes('Compare the following phones')) {
    try {
      // Parse the prompt if it contains phone JSON
      const phonesMatch = prompt.match(/\[([\s\S]*?)\]/);
      if (phonesMatch) {
        const phones = JSON.parse(phonesMatch[0]);
        if (phones && phones.length > 0) {
          return generateLocalComparisonVerdict(phones);
        }
      }
    } catch (e) {
      console.error("Failed to parse phones JSON for comparison fallback:", e);
    }
    return "### Smartphone Compare AI Platform Recommendation\n\nBased on your selected devices, both options represent high-quality choices in their respective pricing segments. We recommend checking their specific benchmarks for camera, battery, and gaming performance in the details panel.";
  }
  
  // If it is a generic chat assistant query
  return generateLocalChatResponse(prompt);
}

function generateLocalComparisonVerdict(phones) {
  if (phones.length === 1) {
    return `### ${phones[0].brand_name} ${phones[0].model} Analysis\n\nThe **${phones[0].brand_name} ${phones[0].model}** is priced at **₹${phones[0].price_inr.toLocaleString()}**. It offers a **${phones[0].display_size}" ${phones[0].display_type}** display with a **${phones[0].refresh_rate}Hz** refresh rate, powered by a **${phones[0].processor}** processor and a **${phones[0].battery_capacity}mAh** battery.\n\n**Verdict:** A solid choice in its segment with an overall score of **${phones[0].overall_score}/100**.`;
  }
  
  // Sort phones by score categories to find the best in each area
  const bestPerf = [...phones].sort((a, b) => b.performance_score - a.performance_score)[0];
  const bestCam = [...phones].sort((a, b) => b.camera_score - a.camera_score)[0];
  const bestBat = [...phones].sort((a, b) => b.battery_score - a.battery_score)[0];
  const bestGam = [...phones].sort((a, b) => b.gaming_score - a.gaming_score)[0];
  const bestVFM = [...phones].sort((a, b) => b.value_for_money_score - a.value_for_money_score)[0];
  const bestOverall = [...phones].sort((a, b) => b.overall_score - a.overall_score)[0];

  let verdict = `### AI Recommendation Engine Verdict\n\nWe analyzed **${phones.length} phones** side-by-side. Here is our expert breakdown:\n\n`;
  
  phones.forEach(p => {
    let focusArea = [];
    if (p.id === bestPerf.id) focusArea.push("Core Performance");
    if (p.id === bestCam.id) focusArea.push("Camera Quality");
    if (p.id === bestBat.id) focusArea.push("Battery Optimization");
    if (p.id === bestGam.id) focusArea.push("Gaming/Graphics");
    if (p.id === bestVFM.id) focusArea.push("Value for Money");
    
    verdict += `- **${p.brand_name} ${p.model}** (₹${p.price_inr.toLocaleString()}): Best for *${focusArea.join(" & ") || "balanced features"}*. It features a **${p.display_type} (${p.refresh_rate}Hz)** display and **${p.charging_speed}W** fast charging.\n`;
  });
  
  verdict += `\n#### Detailed Key Differences:\n\n`;
  
  // Performance comparison detail
  if (bestPerf.id !== bestVFM.id) {
    verdict += `1. **Performance & Gaming:** If raw speed is what you want, the **${bestPerf.brand_name} ${bestPerf.model}** (powered by the **${bestPerf.processor}**) is the top performer. It scores a **${bestPerf.performance_score}/100** in benchmarks.\n`;
  } else {
    verdict += `1. **Performance:** The **${bestPerf.brand_name} ${bestPerf.model}** provides excellent processing speeds with the **${bestPerf.processor}** processor.\n`;
  }
  
  // Camera comparison detail
  verdict += `2. **Photography:** The **${bestCam.brand_name} ${bestCam.model}** leads camera capabilities with a camera score of **${bestCam.camera_score}/100** (featuring: *${bestCam.rear_camera_spec}*).\n`;
  
  // Battery comparison detail
  verdict += `3. **Charging & Endurance:** For battery runtime and recharge speed, the **${bestBat.brand_name} ${bestBat.model}** is the winner (Capacity: **${bestBat.battery_capacity}mAh** with **${bestBat.charging_speed}W** fast charging).\n`;

  // Final Recommendation
  verdict += `\n### 🏆 Recommended Choice: **${bestOverall.brand_name} ${bestOverall.model}**\n\n**Why?** The **${bestOverall.brand_name} ${bestOverall.model}** scores the highest overall (**${bestOverall.overall_score}/100**). It delivers the most cohesive mix of performance, high-quality display, and robust software support, justifying its cost. If you are on a tight budget, the **${bestVFM.brand_name} ${bestVFM.model}** is the smarter buy at **₹${bestVFM.price_inr.toLocaleString()}**, offering **${bestVFM.value_for_money_score}/100** value for money.`;

  return verdict;
}

function generateLocalChatResponse(prompt) {
  const queryText = prompt.toLowerCase();
  
  if (queryText.includes("gaming") || queryText.includes("game") || queryText.includes("pubg") || queryText.includes("genshin")) {
    return `### Smartphone Compare AI Platform Assistant 🎮\n\nIf gaming is your primary focus, you should prioritize **Processor power (GPU)**, **Display refresh rate (120Hz+)**, and **Cooling architecture**.\n\n**Top Recommendations:**\n1. **Poco F6** (₹29,999) - Powered by the **Snapdragon 8s Gen 3**, it has a gaming score of **95/100** and 90W fast charging. It is the absolute king of budget gaming.\n2. **OnePlus 13** (₹69,999) - High-end option with **Snapdragon 8 Elite**, QHD+ screen, and robust vapor cooling.\n3. **iPhone 16 Pro Max** (₹1,44,900) - For AAA games (like Resident Evil) using hardware ray-tracing.\n\n*Would you like me to compare any of these side-by-side?*`;
  }
  
  if (queryText.includes("camera") || queryText.includes("photo") || queryText.includes("video") || queryText.includes("creator")) {
    return `### Smartphone Compare AI Platform Assistant 📸\n\nFor photography and video creation, you want a phone with **Optical Image Stabilization (OIS)**, **Telephoto lenses**, and **advanced image signal processing (ISP)**.\n\n**Top Recommendations:**\n1. **Google Pixel 9 Pro XL** (₹1,24,999) - The king of computational photography, magic eraser, and natural skin tones.\n2. **Samsung Galaxy S25 Ultra** (₹1,34,999) - Ultra-versatile with 200MP sensor and a 5x optical telephoto lens.\n3. **Vivo V40 Pro** (₹49,999) - Co-engineered with **Zeiss** optics, providing incredible portraits at a mid-range cost.\n\n*Would you like to compare their camera specifications?*`;
  }
  
  if (queryText.includes("battery") || queryText.includes("charging") || queryText.includes("last long")) {
    return `### Smartphone Compare AI Platform Assistant 🔋\n\nFor best battery longevity and charging speed, here are the leaders:\n\n**Top Recommendations:**\n1. **OnePlus Nord CE4** (₹24,999) - Packs a massive **5500mAh** battery and charges in under 30 minutes with **100W SuperVOOC** in the box.\n2. **OnePlus 13** (₹69,999) - High-capacity **6000mAh** cell with both **100W wired and 50W wireless charging**.\n3. **Redmi Note 14 Pro+** (₹32,999) - Solid **6200mAh** battery featuring **90W charging** (Silicon-Carbon battery).\n\n*Which one fits your budget?*`;
  }

  if (queryText.includes("budget") || queryText.includes("cheap") || queryText.includes("under") || queryText.includes("₹")) {
    // Attempt to extract money value
    const match = queryText.match(/(?:under|below|around)?\s*(?:rs\.?|inr|₹)?\s*(\d+000)/);
    const budgetValue = match ? parseInt(match[1]) : 30000;
    
    return `### Smartphone Compare AI Platform Assistant 💰\n\nLooking for the best options around/under **₹${budgetValue.toLocaleString()}**?\n\n**Top Recommendations:**\n- **Nothing Phone (2a) Plus** (₹27,999) - The clean UI option, glyph design, long battery, and zero bloatware.\n- **Poco F6** (₹29,999) - Absolute powerhouse for performance seekers.\n- **OnePlus Nord CE4** (₹24,999) - Excellent daily driver with stellar 100W charging.\n\n*Would you like to load a comparison table of these under ₹30,000 devices?*`;
  }

  return `### Hello from Smartphone Compare AI Platform! 👋\n\nI am your smart tech assistant. You can ask me questions like:\n- *"I need a phone under ₹30,000 for gaming."*\n- *"Which has a better camera: Galaxy S25 Ultra or Pixel 9 Pro XL?"*\n- *"Which phones support wireless charging under ₹40,000?"*\n\nLet me know how I can help you choose your next smartphone!`;
}

module.exports = {
  generateAIResponse
};
