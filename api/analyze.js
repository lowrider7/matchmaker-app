export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { targetUrl, scoutUrl, additionalInfo } = req.body;
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
                // UPDATED FOR 2026
                model: "claude-3-7-sonnet-latest", 
                max_tokens: 4000,
                system: `You are the STRATEGIC SCOUT V3.0 INTERNAL FIREBOX. 
                Perform a 20-point analysis. Return ONLY a JSON object.
                {
                    "structuralGorge": "analysis here",
                    "strategicAssessment": "assessment here"
                }`,
                messages: [{
                    role: "user", 
                    content: `Analyze Prospect: ${targetUrl} vs Scout: ${scoutUrl}. Context: ${additionalInfo || "None"}`
                }]
            })
        });

        const data = await response.json();

        // FIX: Check if content exists before accessing [0]
        if (!data.content || data.content.length === 0) {
            console.error("ANTHROPIC API ERROR:", data);
            return res.status(500).json({ 
                structuralGorge: "API ERROR: " + (data.error?.message || "No content returned"),
                strategicAssessment: "Check Anthropic Dashboard for Credit/Rate Limits."
            });
        }

        const rawText = data.content[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch[0]);

        res.status(200).json({
            structuralGorge: parsed.structuralGorge || "Data missing.",
            strategicAssessment: parsed.strategicAssessment || "Data missing."
        });

    } catch (error) {
        res.status(500).json({ 
            structuralGorge: "FIREBOX CRASH: " + error.message,
            strategicAssessment: "Review server logs." 
        });
    }
}
