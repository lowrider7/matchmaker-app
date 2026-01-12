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
                // STABLE 2026 CLAUDE 4.5 ID
                model: "claude-4-5-sonnet-20240229", 
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

        // Catch API-level errors (like "Invalid Key" or "Overloaded")
        if (data.error) {
            return res.status(200).json({ 
                structuralGorge: `API REJECTION: ${data.error.type}`,
                strategicAssessment: `REASON: ${data.error.message}`
            });
        }

        const rawText = data.content[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error("Could not find JSON in AI response.");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        res.status(200).json({
            structuralGorge: parsed.structuralGorge || "Moat analysis failed.",
            strategicAssessment: parsed.strategicAssessment || "Strategic assessment failed."
        });

    } catch (error) {
        console.error("FIREBOX FAILURE:", error);
        res.status(200).json({ 
            structuralGorge: "FIREBOX SYSTEM ERROR",
            strategicAssessment: error.message 
        });
    }
}
