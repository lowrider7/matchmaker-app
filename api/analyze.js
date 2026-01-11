export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    const systemPrompt = `Analyze Target: ${targetUrl} for Scout: ${scoutUrl}. 
    Return ONLY a JSON object with these EXACT keys: 
    "status": "complete",
    "structuralGorge": "2 paragraphs on the moat",
    "strategicAssessment": "2 paragraphs on the prospect value"`;

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
                messages: [{ role: 'user', content: systemPrompt }]
            })
        });

        const data = await response.json();
        let text = data.content[0].text;
        
        // Clean any non-JSON text the AI might have added
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        const jsonOnly = text.substring(start, end + 1);
        
        return res.status(200).json(JSON.parse(jsonOnly));
    } catch (e) {
        return res.status(500).json({ error: "Intelligence failure." });
    }
}
