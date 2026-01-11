export default async function handler(req, res) {
    // 1. CORS & HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    // 2. 2026 MODEL UPDATE
    // The 2024 version is retired. Using the current Jan 2026 stable Sonnet build.
    const CURRENT_MODEL = 'claude-sonnet-4-5-20250929'; 

    const systemPrompt = "You are a Senior Business Development Strategist. You output strictly valid JSON.";
    
    const userMessage = `Partner Ranking Sweep:
    - Target (Prospect): ${targetUrl}
    - Scout (Our Firm): ${scoutUrl}
    - Context: ${additionalInfo || "Strategic Growth/Co-marketing"}

    ANALYSIS REQUIREMENTS:
    1. Identify the 'Moat' (Prospect leverage).
    2. Identify the 'Gorge' (The synergy gap our firm bridges).
    3. Identify the 'Hook' (Urgent trigger for outreach).

    OUTPUT ONLY THIS JSON OBJECT:
    {
        "status": "complete",
        "structuralGorge": "[2 paragraphs of Moat/Gorge logic]",
        "strategicAssessment": "[2 paragraphs of Value/Hook logic]"
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
                model: CURRENT_MODEL,
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        const data = await response.json();

        // 3. DETAILED ERROR LOGGING
        if (data.error) {
            console.error("ANTHROPIC API REJECTION:", data.error.message);
            throw new Error(`Anthropic: ${data.error.message}`);
        }

        if (!data.content || data.content.length === 0) {
            throw new Error("No data returned from AI. Verify API Key/Credits.");
        }

        const text = data.content[0].text;
        
        // 4. AGGRESSIVE JSON EXTRACTION
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI returned text instead of JSON format.");
        
        const finalData = JSON.parse(jsonMatch[0]);

        return res.status(200).json({
            status: "complete",
            structuralGorge: finalData.structuralGorge || "Gorge analysis failed.",
            strategicAssessment: finalData.strategicAssessment || "Assessment failed."
        });

    } catch (error) {
        console.error("INTERNAL SERVER ERROR:", error.message);
        return res.status(500).json({ 
            error: "Intelligence failure.",
            structuralGorge: "Backend Error: " + error.message,
            strategicAssessment: "Consult your server logs for the raw response."
        });
    }
}
