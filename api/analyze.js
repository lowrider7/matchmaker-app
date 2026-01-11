const axios = require('axios');

async function performScoutAnalysis(prospectUrl, scoutUrl) {
    const apiEndpoint = "https://api.anthropic.com/v1/messages";
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const prompt = `
        System: You are the Strategic Scout V3.0 Internal Firebox Logic. 
        Analyze the relationship between the Prospect (${prospectUrl}) and the Scout Firm (${scoutUrl}).
        
        Provide a detailed analysis in the following JSON format:
        {
            "gorge_moat": "Analysis of competitive barriers and market defensibility.",
            "strategic_assessment": "High-level summary of the partnership or acquisition value.",
            "prospect_value": "Specific numerical or strategic value score (1-100)."
        }
    `;

    try {
        const response = await axios.post(apiEndpoint, {
            model: "claude-4-5-sonnet-latest",
            max_tokens: 2000,
            messages: [
                { "role": "user", "content": prompt }
            ]
        }, {
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
        });

        // Extracting the JSON from the Claude response
        const content = response.data.content[0].text;
        return JSON.parse(content);

    } catch (error) {
        console.error("Analysis Error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to reach Anthropic API. Ensure your API key is valid and model is current.");
    }
}

module.exports = { performScoutAnalysis };
