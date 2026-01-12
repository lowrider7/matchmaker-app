export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prospectUrl, nexusUrl } = req.body;
    
    // Pulling hidden keys from Vercel Environment Variables
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
                system: `You are the ALLIANCE LOGIC ENGINE. 
                Perform a deterministic analysis of the partnership between the Nexus (${nexusUrl}) and Prospect (${prospectUrl}). 
                
                Evaluate these 5 Pillars (0-20 points each):
                1. Problem-Solution Fit: Does Prospect bridge a Nexus bottleneck?
                2. Strategic Defensibility: Does this build a competitive moat?
                3. Distribution Synergy: Audience overlap & co-marketing velocity.
                4. Institutional Alignment: Brand trust & safety.
                5. Value Creation: Ecosystem liquidity & new revenue.

                Return ONLY a JSON object:
                {
                  "totalScore": 0-100,
                  "pillars": [
                    { "name": "Pillar Name", "score": 0-20, "insight": "1-sentence reasoning" }
                  ]
                }`,
                messages: [{ role: "user", content: `Nexus: ${nexusUrl} | Prospect: ${prospectUrl}` }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(200).json({ error: data.error.message });
        }

        const rawText = data.content[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch[0]);

        res.status(200).json(parsed);
    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
}
