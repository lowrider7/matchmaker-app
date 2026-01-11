export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    if (!targetUrl || !scoutUrl) {
        return res.status(400).json({ error: 'Target and Scout URLs are mandatory.' });
    }

    const systemPrompt = `You are a Senior Partner-level Strategic Scout. Today's date is January 11, 2026.
MISSION: Evaluate the Target (${targetUrl}) as a prospect for the Scout (${scoutUrl}).

LOGIC FIREBOX - MANDATORY DIRECTIVES:
1. HONESTY PROTOCOL: If you do not recognize one of the entities or the URL is ambiguous, you MUST set "status" to "needs_info" and provide a "clarifyingQuestion".
2. THE GORGE: Identify the asymmetric structural moat the Target has that the Scout should care about.
3. THE ARBITRAGE: Identify the hidden economic unlock if these two entities collaborate or compete.
4. PROSPECT FIT: Rate the Target as a prospect for the Scout (Acquisition, Partnership, or Threat).
5. PROACTIVE SIGNAL: Suggest one niche the Scout should monitor based on this Target's profile.

OUTPUT: Return ONLY a valid JSON object with: "status", "clarifyingQuestion", "structuralGorge", "arbitrageHunter", "strategicAssessment".`;

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
                messages: [{ role: 'user', content: `Scout: ${scoutUrl} | Target: ${targetUrl}. Context: ${additionalInfo || 'None'}` }]
            })
        });

        const data = await response.json();
        const analysis = JSON.parse(data.content[0].text);
        return res.status(200).json(analysis);
    } catch (e) {
        return res.status(500).json({ error: "Intelligence failure. Check API credits." });
    }
}
