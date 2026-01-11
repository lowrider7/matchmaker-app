export default async function handler(req, res) {
    // 1. SET HEADERS & CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    // 2. CONSTRUCT THE PROMPT
    const userMessage = `Perform a Strategic Partnership Sweep.
    PROSPECT (Target URL): ${targetUrl}
    OUR FIRM (Scout URL): ${scoutUrl}
    CONTEXT: ${additionalInfo || "General partnership growth"}

    TASK:
    Analyze the 'Moat' (the prospect's strengths/assets) and the 'Gorge' (the gap or unrealized potential that our firm uniquely fills). 
    Provide a strategic assessment of the partnership value and a 'Hook' for outreach.

    OUTPUT FORMAT:
    You must respond ONLY with a valid JSON object. No preamble.
    {
        "status": "complete",
        "structuralGorge": "[2 paragraphs on the moat vs the gap]",
        "strategicAssessment": "[2 paragraphs on the prospect value rank and hook]"
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
                system: "You are a senior business development strategist. You communicate strictly in JSON format.",
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        const data = await response.json();

        // Check for Anthropic-level errors (billing, key, etc.)
        if (data.error) {
            console.error("ANTHROPIC API ERROR:", data.error);
            throw new Error(`Anthropic Error: ${data.error.message}`);
        }

        if (!data.content || data.content.length === 0) {
            console.error("EMPTY CONTENT FROM CLAUDE:", JSON.stringify(data));
            throw new Error("Anthropic returned an empty content array. Check your API credits or safety filters.");
        }

        const text = data.content[0].text;
        
        // 3. ROBUST JSON EXTRACTION
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("RAW TEXT RECEIVED (NO JSON FOUND):", text);
            throw new Error("Claude failed to return a valid JSON object.");
        }
        
        const parsedData = JSON.parse(jsonMatch[0]);

        // 4. SANITIZE OUTPUT FOR THE FRONTEND
        const sanitizedOutput = {
            status: parsedData.status || "complete",
            structuralGorge: parsedData.structuralGorge || "Structural analysis could not be generated.",
            strategicAssessment: parsedData.strategicAssessment || "Strategic assessment could not be generated."
        };

        return res.status(200).json(sanitizedOutput);

    } catch (error) {
        console.error("SERVER SIDE ERROR:", error.message);
        return res.status(500).json({ 
            error: "Intelligence failure.",
            structuralGorge: "Backend Error: " + error.message,
            strategicAssessment: "Consult server logs for the raw response trace."
        });
    }
}
