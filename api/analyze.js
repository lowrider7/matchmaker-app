export default async function handler(req, res) {
    // ... headers and method checks stay the same ...

    const { targetUrl, scoutUrl, additionalInfo } = req.body;

    // REFINED PROMPT: Forcing Claude to behave as a pure API
    const systemPrompt = `Analyze the partnership potential for Target: ${targetUrl} against Scout: ${scoutUrl}. 
    Additional context: ${additionalInfo}

    OUTPUT INSTRUCTIONS:
    Return ONLY a valid JSON object. No preamble, no conversational text.
    
    REQUIRED KEYS:
    {
        "status": "complete",
        "structuralGorge": "[Detailed analysis of the Moat and the Gorge gap]",
        "strategicAssessment": "[Analysis of the Hook and the Prospect Rank]"
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
                // TIP: Using system role + user role is more stable for formatting
                system: "You are a strategic business analyst. You only output valid JSON.",
                messages: [{ role: 'user', content: systemPrompt }]
            })
        });

        const data = await response.json();

        // Check if content exists to avoid "cannot read property of undefined"
        if (!data.content || data.content.length === 0) {
            throw new Error("Empty response from Anthropic");
        }

        let text = data.content[0].text;
        
        // BETTER JSON STRIPPING
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        const finalData = JSON.parse(jsonMatch[0]);

        // FINAL FAILSAFE: Ensure keys exist so index.html doesn't break
        const sanitizedResponse = {
            status: finalData.status || "complete",
            structuralGorge: finalData.structuralGorge || "Data unavailable for this sweep.",
            strategicAssessment: finalData.strategicAssessment || "Assessment could not be generated."
        };

        return res.status(200).json(sanitizedResponse);

    } catch (e) {
        console.error("API ERROR:", e);
        return res.status(500).json({ 
            error: "Intelligence failure.",
            structuralGorge: "Sweep failed at the API layer.",
            strategicAssessment: "Please check your Anthropic API Key or network."
        });
    }
}
