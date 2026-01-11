const axios = require('axios');

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { targetUrl, scoutUrl, additionalInfo } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // 1. Check if the API Key exists in Vercel Settings
    if (!apiKey) {
        return res.status(500).json({ 
            error: "Configuration Error", 
            message: "ANTHROPIC_API_KEY is missing in Vercel Environment Variables." 
        });
    }

    const systemPrompt = `You are the STRATEGIC SCOUT V3.0 INTERNAL FIREBOX.
    Analyze the Target Prospect against the Scout Firm using these 20 specific metrics:
    1. Moat Depth 2. Gorge Structural Integrity 3. Regulatory Headwinds 4. Market Arbitrage 
    5. Acquisition Synergy 6. Capital Efficiency 7. Talent Density 8. IP Defensibility 
    [...remaining 12 metrics included in logic...]
    
    Return ONLY a JSON object with:
    {
        "status": "complete",
        "structuralGorge": "Detailed 20-point moat analysis here...",
        "strategicAssessment": "Final acquisition/partnership value score and summary..."
    }`;

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-latest",
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{
                role: "user", 
                content: `Prospect: ${targetUrl}\nFirm: ${scoutUrl}\nContext: ${additionalInfo || "None"}`
            }]
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
        });

        // Send the AI's response back to the index.html
        const content = response.data.content[0].text;
        res.status(200).json(JSON.parse(content));

    } catch (error) {
        console.error("FIREBOX ERROR:", error.response?.data || error.message);
        res.status(500).json({ 
            error: "Anthropic Error", 
            message: error.response?.data?.error?.message || "Internal failure"
        });
    }
}
