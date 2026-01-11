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
                Perform a 20-point analysis. 
                Return ONLY a JSON object. No intro text. No markdown.
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
        
        // --- THE CLEANER ---
        // This finds the { and } even if the AI adds "Here is your JSON:" text.
        const rawText = data.content[0].text;
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}') + 1;
        const jsonString = rawText.substring(jsonStart, jsonEnd);
        
        const parsed = JSON.parse(jsonString);

        // This sends exactly what your HTML 'undefined' boxes are looking for
        res.status(200).json({
            structuralGorge: parsed.structuralGorge || "Data missing from analysis.",
            strategicAssessment: parsed.strategicAssessment || "Data missing from assessment."
        });

    } catch (error) {
        console.error("FIREBOX FAILURE:", error);
        res.status(500).json({ error: "Server Error", message: error.message });
    }
}
