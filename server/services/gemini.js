const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config(); // Load .env variables

// 1. Check if Key is loaded
const KEY = process.env.GEMINI_API_KEY;

async function analyzeText(context) {
    const { featureName, testName, script, errorLog } = context;

    // 2. Debugging: Log if key is missing
    if (!KEY) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file");
        return "Configuration Error: GEMINI_API_KEY is missing. Check server console.";
    }

    try {
        // Using 'gemini-1.5-flash' for speed, fallback to 'gemini-pro' if needed
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`;

        const prompt = `
        You are a Senior QA Automation Architect.
        Analyze this failed test case:
        Feature: ${featureName}
        Test: ${testName}
        
        Error Log: "${errorLog}"
        
        Code:
        ${script}
        
        Provide a concise Root Cause Analysis (1 sentence) and a Specific Fix (1 sentence).
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const resp = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout
        });

        // 3. Extract text safely
        const candidate = resp.data?.candidates?.[0];
        if (candidate?.finishReason === "SAFETY") {
            return "AI blocked this content due to safety settings.";
        }

        return candidate?.content?.parts?.[0]?.text || "AI returned no content.";

    } catch (err) {
        // 4. DETAILED ERROR LOGGING
        console.error("❌ Gemini API Request Failed:");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Data: ${JSON.stringify(err.response.data)}`);

            // RETURN THE REAL ERROR TO THE UI
            return `AI Error (${err.response.status}): ${err.response.data?.error?.message || 'Unknown API Error'}`;
        } else {
            console.error(err.message);
            return `Connection Error: ${err.message}`;
        }
    }
}

module.exports = { analyzeText };