export default async function handler(req, res) {
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
                system: "You are the STRATEGIC SCOUT V3.0 INTERNAL FIREBOX. Analyze the Target vs the Scout using 20-point logic. Return JSON only.",
                messages: [{
                    role: "user", 
                    content: `Prospect: ${targetUrl}\nFirm: ${scoutUrl}\nContext: ${additionalInfo || "None"}`
                }]
            })
        });

        const data = await response.json();

        // This sends the data back to your dashboard
        const result = JSON.parse(data.content[0].text);
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
}
