// netlify/functions/analyze-listing.js
// Serverless function to analyze a realtor.ca URL using Grok API
// Deployed with the static site on Netlify.

export default async (req, context) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { url } = body;

  if (!url || typeof url !== 'string' || !url.includes('realtor.ca')) {
    return new Response(JSON.stringify({ error: 'Please provide a valid realtor.ca URL' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'XAI_API_KEY not configured in Netlify environment variables. Add it in Site settings > Environment variables.' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch the listing page content (server-side, no CORS issues)
  let html = '';
  try {
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow'
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch page: ${pageResponse.status}`);
    }

    html = await pageResponse.text();

    // Truncate if extremely long to stay under token limits
    const maxHtmlLength = 12000;
    if (html.length > maxHtmlLength) {
      html = html.substring(0, maxHtmlLength) + '\n... [content truncated for length]';
    }

  } catch (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return new Response(JSON.stringify({ 
      error: 'Could not fetch the listing page. The site might block scraping or the URL is invalid.' 
    }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Compact but effective system prompt for structured extraction
  // Adapted from the original master prompt, focused on "given HTML, output exact schema"
  const systemPrompt = `You are an elite Canadian real estate data extraction AI for a young couple house-hunting in the Kincardine, Ontario area (20km radius). 

Your job is to turn the provided realtor.ca HTML into clean, structured JSON that matches a specific schema exactly. Be precise, literal, and conservative — never invent data.

**Output rules (critical):**
- Return ONLY a single valid JSON object. No explanations, no markdown fences, no extra text before or after.
- Use the exact field names below.
- If a value is missing or unclear from the HTML, use null (or "Not disclosed" for strings where appropriate).
- Prices and taxes as plain integers (no $ or commas).
- For arrays, be selective and high-signal.

**Required top-level fields (exact names and types):**
- id: string (prefer numeric ID from URL path, e.g. "29727693", fallback to MLS number)
- sourceUrl: string (the exact URL provided)
- mlsNumber: string or null
- address: string (short, e.g. "14 Sunset Place")
- fullAddress: string
- price: number (integer)
- priceDisplay: string (e.g. "$895,000")
- bedrooms: number
- bathrooms: number
- sqftRange: string (exact as shown, e.g. "1500 - 2000")
- lotSize: string or null
- yearBuilt: number or null
- propertyType: string
- style: string
- ownership: string
- annualTaxes: number or null
- water: string or null
- sewer: string or null
- heating: string or null
- cooling: string or null
- parking: string or null
- basement: string or null
- features: string[] (notable items like "Cul-de-sac", "Generator", "Covered porch 24' x 10'", "Tankless water heater")
- description: string (the main listing description text, cleaned)
- locationNotes: string or null
- nearbyAmenities: string[]
- daysOnMarket: number or null
- agent: { name: string, brokerage: string, phone: string | null } or null
- photoUrls: string[] (up to 8 good high-res image URLs from the page, prefer cdn.realtor.ca highres)
- virtualTourUrl: string or null
- aiAnalysis: {
    budgetFit: string,
    locationScore: number (1-10),
    newBuildScore: number (1-10),
    lifestyleScore: number (1-10),
    overallMatchScore: number (1-10),
    summary: string (2-4 sentences),
    pros: string[] (5-8),
    cons: string[] (4-7),
    recommendedAction: string
  }

**Additional rules for aiAnalysis:**
- Tailor to: early 30s couple, first home, $950k CAD pre-approval, prefer newer builds (2018+), out-of-town/lakeside/private in Kincardine area.
- Be balanced and realistic about rural issues (septic, etc.).
- locationScore: heavily weight proximity + "out of town / private / beach".
- newBuildScore: 2020+ = 9-10, etc.

The user will provide the listing URL and the raw HTML content below. Extract everything possible directly from it.`;

  const userMessage = `Listing URL: ${url}

Raw HTML content of the page (cleaned/truncated):
${html}

Extract the data into the exact JSON schema described in the system prompt. Output only the JSON object.`;

  try {
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || 'grok-4.3',   // Set GROK_MODEL env var if you want a specific model (e.g. grok-4.3 or grok-4.3-latest). Yes, you can (and should) set GROK_MODEL=grok-4.3 in your Netlify environment variables. The correct API identifier is "grok-4.3" (hyphen, no spaces). This is the current flagship model as of 2026.
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 2500
      })
    });

    if (!grokResponse.ok) {
      const errText = await grokResponse.text();
      console.error('Grok API error:', grokResponse.status, errText);
      let friendly = `Grok API error: ${grokResponse.status}. `;
      if (grokResponse.status === 401 || grokResponse.status === 403) {
        friendly += 'Invalid or missing XAI_API_KEY. ';
      } else if (grokResponse.status === 402 || (errText && errText.toLowerCase().includes('credit'))) {
        friendly += 'You need to add credits/billing to your xAI account at https://console.x.ai/ before the API will work. ';
      }
      friendly += 'Check Netlify function logs for full details.';
      return new Response(JSON.stringify({ 
        error: friendly
      }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const grokData = await grokResponse.json();
    let rawContent = grokData.choices?.[0]?.message?.content || '';

    // Try to extract clean JSON (handle possible ```json wrappers)
    let jsonText = rawContent.trim();
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw content:', rawContent);
      return new Response(JSON.stringify({ 
        error: 'AI returned invalid JSON. Try again or use the manual paste method.',
        raw: rawContent.substring(0, 500)
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure minimum required fields and the source URL
    parsed.sourceUrl = url;
    if (!parsed.id) parsed.id = 'imported-' + Date.now();

    // Return the clean property object
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ 
      error: 'Unexpected error analyzing the listing. ' + (err.message || '') 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};