export default async function handler(req, res) {
    // 1. HEADERS & CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    // 2. THE PROMPT
    const systemPrompt = `Analyze the partnership potential for Target: ${targetUrl} against Scout: ${scoutUrl}. 
    Additional context: ${additionalInfo || "None provided"}

    OUTPUT INSTRUCTIONS:
    Return ONLY a valid JSON object. No preamble, no conversational text.
    
    REQUIRED KEYS:
    {
        "status": "complete",
        "structuralGorge": "[2 paragraphs on the moat vs the gap]",
        "strategicAssessment": "[2 paragraphs on the prospect value rank]"
    }`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                system: "You are a strategic business analyst. You only output valid JSON.",
                messages: [{ role: 'user', content: systemPrompt }]
            })
        });

        const data = await response.json();

        // Debug Log - check your terminal to see if Claude is actually talking
        console.log("CLAUDE RAW RESPONSE:", JSON.stringify(data));

        if (!data.content || data.content.length === 0) {
            throw new Error("Anthropic returned an empty content array.");
        }

        let text = data.content[0].text;
        
        // 3. ROBUST JSON PARSING
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("NO JSON DETECTED IN TEXT:", text);
            throw new Error("No JSON found in response");
        }
        
        const parsedData = JSON.parse(jsonMatch[0]);

        // 4. SANITIZATION (Prevents 'undefined' in index.html)
        const output = {
            status: parsedData.status || "complete",
            structuralGorge: parsedData.structuralGorge || "Gorge analysis unavailable.",
            strategicAssessment: parsedData.strategicAssessment || "Strategic assessment unavailable."
        };

        return res.status(200).json(output);

    } catch (error) {
        console.error("BACKEND ERROR:", error);
        return res.status(500).json({ 
            error: "Intelligence failure.",
            structuralGorge: "Backend Error: " + error.message,
            strategicAssessment: "Check server logs for details."
        });
    }
}
