// api/analyze.js - The Senior Partner Brain
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { companyUrl, additionalInfo } = req.body;

    const systemPrompt = `You are a Senior Partner strategic analyst. 
    MISSION: Analyze the company at ${companyUrl}.
    
    LOGIC FIREBOX:
    1. If you cannot identify this company or the URL seems broken, set "status" to "needs_info" and provide a "clarifyingQuestion".
    2. If you recognize the entity, set "status" to "complete" and provide the full analysis.
    3. Return ONLY a JSON object with: "status", "clarifyingQuestion", "structuralGorge", "arbitrageHunter", "strategicAssessment".`;

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
                max_tokens: 2000,
                system: systemPrompt,
                messages: [{ role: 'user', content: `Analyze ${companyUrl}. ${additionalInfo ? 'Context: ' + additionalInfo : ''}` }]
            })
        });

        const data = await response.json();
        const analysis = JSON.parse(data.content[0].text);
        return res.status(200).json(analysis);
    } catch (e) {
        return res.status(500).json({ error: "Intelligence failure." });
    }
}
