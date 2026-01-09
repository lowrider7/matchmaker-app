// api/analyze.js - Vercel Serverless Function
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { companyUrl, realityTier, strategicContext } = req.body;

    if (!companyUrl || !realityTier || !strategicContext) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract company name from URL (fixing the 'Www' issue)
    function extractCompanyName(url) {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname;
            hostname = hostname.replace(/^www\./i, '');
            const parts = hostname.split('.');
            if (parts.length > 0) {
                let companyName = parts[0];
                return companyName.charAt(0).toUpperCase() + companyName.slice(1);
            }
            return hostname;
        } catch (e) {
            return 'the company';
        }
    }

    const companyName = extractCompanyName(companyUrl);
    const currentDate = 'January 8, 2026';

    // Reality Tier specific context and jargon isolation
    const tierContext = {
        'Institutional RWA': {
            domain: 'institutional finance and real-world assets',
            forbidden: ['GPU', 'inference', 'tensor', 'neural', 'training', 'model', 'compute cluster', 'CUDA'],
            focus: 'tokenization, liquidity, regulatory arbitrage, custody, settlement infrastructure'
        },
        'Sovereign AI': {
            domain: 'sovereign AI infrastructure and compute',
            forbidden: ['yield', 'bonds', 'derivatives', 'equity', 'AUM', 'basis points', 'carry trade'],
            focus: 'compute sovereignty, inference capacity, model deployment, GPU economics, latency arbitrage'
        },
        'Orbital Tech': {
            domain: 'space technology and orbital infrastructure',
            forbidden: ['DeFi', 'staking', 'mining rewards', 'tensor cores', 'backpropagation'],
            focus: 'orbital mechanics, launch economics, satellite constellations, space manufacturing'
        },
        'Prestige': {
            domain: 'luxury brand positioning and cultural capital',
            forbidden: ['hash rate', 'sharding', 'consensus mechanism', 'smart contracts'],
            focus: 'brand equity, cultural resonance, scarcity economics, prestige signaling'
        }
    };

    const tier = tierContext[realityTier] || tierContext['Prestige'];

    // Construct the system prompt with Logic Firebox
    const systemPrompt = `You are a Senior Partner-level strategic analyst conducting deep intelligence assessment. Today's date is ${currentDate}.

MISSION: Analyze ${companyName} (${companyUrl}) within the ${realityTier} reality tier.

STRATEGIC CONTEXT PROVIDED:
${strategicContext}

LOGIC FIREBOX - MANDATORY DIRECTIVES:

1. STRUCTURAL GORGE IDENTIFICATION:
   - Identify the asymmetric advantage that creates an unbridgeable competitive moat
   - This is NOT just a competitive advantage - it's a structural positioning that competitors cannot replicate without fundamental restructuring
   - Focus on: network effects, regulatory capture, infrastructure lock-in, or irreversible market positioning
   - Be specific about WHY this gorge is structural and not tactical

2. ARBITRAGE HUNTER DETECTION:
   - Identify the economic unlock or value capture mechanism that others are missing
   - This is the hidden profit engine or market inefficiency being exploited
   - Focus on: pricing power, cost structure advantages, regulatory arbitrage, or information asymmetries
   - Quantify or specify the economic magnitude where possible

3. ISOLATION RULE - STRICTLY ENFORCE:
   - This analysis is in the ${tier.domain} domain
   - YOU ARE ABSOLUTELY FORBIDDEN from using these terms: ${tier.forbidden.join(', ')}
   - If you use ANY of these forbidden terms, you have failed the isolation rule
   - Focus vocabulary ONLY on: ${tier.focus}
   - Speak in the native language of ${realityTier} practitioners

4. OUTPUT STRUCTURE:
   Your response must be a valid JSON object with exactly these three keys:
   {
     "structuralGorge": "2-3 paragraphs analyzing the asymmetric structural advantage",
     "arbitrageHunter": "2-3 paragraphs identifying the economic unlock mechanism",
     "strategicAssessment": "2-3 paragraphs providing overall strategic intelligence synthesis"
   }

5. TONE AND STYLE:
   - Write as a Senior Partner presenting to other Senior Partners
   - Be direct, sophisticated, and assume high contextual intelligence
   - Avoid platitudes and obvious observations
   - Provide actionable strategic insight
   - No marketing speak or generic business jargon

CRITICAL: Output ONLY the JSON object. No preamble, no markdown formatting, no additional text.`;

    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            console.error('ANTHROPIC_API_KEY not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                temperature: 1,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Analyze ${companyName} for ${realityTier} strategic positioning. Provide your analysis as a JSON object with structuralGorge, arbitrageHunter, and strategicAssessment fields.`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Anthropic API error:', errorData);
            return res.status(response.status).json({ error: 'AI analysis failed' });
        }

        const data = await response.json();
        
        // Extract the text content from Claude's response
        const textContent = data.content.find(block => block.type === 'text')?.text || '';
        
        // Parse JSON from response (handle potential markdown code blocks)
        let analysisResult;
        try {
            // Remove markdown code blocks if present
            let cleanedText = textContent.trim();
            cleanedText = cleanedText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
            cleanedText = cleanedText.trim();
            
            analysisResult = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw response:', textContent);
            return res.status(500).json({ error: 'Failed to parse analysis results' });
        }

        // Validate response structure
        if (!analysisResult.structuralGorge || !analysisResult.arbitrageHunter || !analysisResult.strategicAssessment) {
            return res.status(500).json({ error: 'Invalid analysis structure returned' });
        }

        return res.status(200).json(analysisResult);

    } catch (error) {
        console.error('Error in analysis:', error);
        return res.status(500).json({ error: 'Internal server error during analysis' });
    }
}
