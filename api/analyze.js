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
                model: "claude-3-5-sonnet-latest",
                max_tokens: 4000,
                system: `You are the STRATEGIC SCOUT V3.0 INTERNAL FIREBOX. 
                Perform a 20-point analysis. Return ONLY a JSON object.
                {
                    "structuralGorge": "analysis",
                    "strategicAssessment": "assessment"
                }`,
                messages: [{
                    role: "user", 
                    content: `Analyze Prospect: ${targetUrl} vs Scout: ${scoutUrl}. Context: ${additionalInfo || "None"}`
                }]
            })
        });

        const data = await response.json();
        const rawText = data.content[0].text;

        // V3.1 BULLETPROOF PARSER: Finds the JSON block even if text surrounds it
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Intelligence Stream Corrupted: No JSON block found.");
        
        const parsed = JSON.parse(jsonMatch[0]);

        // MAPPING: Normalizes potential key variations from the AI
        res.status(200).json({
            structuralGorge: parsed.structuralGorge || parsed.structural_gorge || "Moat data inaccessible.",
            strategicAssessment: parsed.strategicAssessment || parsed.strategic_assessment || "Assessment data inaccessible."
        });

    } catch (error) {
        console.error("FIREBOX FAILURE:", error);
        res.status(500).json({ 
            error: "Server Error", 
            structuralGorge: "Critical Failure: " + error.message,
            strategicAssessment: "Check API Key and URL structure."
        });
    }
}
