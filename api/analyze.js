export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { prospectUrl, nexusUrl } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-5-20250929", 
                max_tokens: 2500,
                system: `You are a CYNICAL STRATEGIC AUDITOR for a Private Equity firm. Your job is to KILL weak partnership ideas.

                RULES:
                1. START AT ZERO: Only award points for concrete technical/operational necessity. 
                2. NO GIMMICKS: If it's just "marketing" or "community," score it below 5.
                3. SECTOR LOCK: If they are in different industries, Problem-Solution Fit must be near 0.
                4. BE BRUTAL: Your reputation depends on stopping bad deals.

                Return ONLY a JSON object:
                { "totalScore": 0-100, "pillars": [ { "name": "Pillar Name", "score": 0-20, "insight": "One blunt sentence." } ] }`,
                messages: [{ role: "user", content: `Nexus: ${nexusUrl} | Prospect: ${prospectUrl}` }]
            })
        });

        const data = await response.json();
        
        // Error handling for Anthropic API
        if (!data.content || !data.content[0]) {
            return res.status(500).json({ error: "AI failed to respond", detail: data });
        }

        const rawText = data.content[0].text;
        
        // This Regex finds the JSON even if the AI adds "Brutal" commentary before or after
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(500).json({ error: "Invalid JSON format from AI", raw: rawText });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        res.status(200).json(parsed);

    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
}
