
// Setup type definitions for Deno
// https://deno.land/manual/getting_started/setup_your_environment

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight - CRITICAL
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Health Check
        if (req.method === 'GET') {
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            return new Response(JSON.stringify({
                status: 'online',
                service: 'Smart Warranty Scanner',
                mode: 'fetch-direct-timeout',
                keyConfigured: !!apiKey
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (req.method === 'POST') {
            let text = '';
            try {
                const body = await req.json();
                text = body.text;
            } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("Invalid JSON body");
            }

            if (!text) throw new Error("No text provided");

            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) {
                console.error("Missing GEMINI_API_KEY");
                throw new Error("GEMINI_API_KEY not set");
            }

            // 3. Direct Fetch to Gemini API
            // User reports this is the only available model currently
            const modelName = "gemini-2.5-flash-lite";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const prompt = `Analyze this raw OCR text from a warranty/receipt. The text may be in English, Czech, or other languages. Extract the: Product Name, Store Name, Purchase Date, Price, Currency, and Warranty Duration in months. 
            
            Translate store names or product descriptions to English only if they are completely unintelligible, otherwise keep original names. Detect currency correctly (e.g., "Kč" = CZK, "$" = USD, "€" = EUR).

            IMPORTANT for Czech receipts: 
            - The price MUST be the final total amount ("Celkem", "Celkem k úhradě", "K úhradě").
            - NEVER select a value labeled "Cena bez DPH", "Základ daně", or "DPH".
            - If multiple prices are present, look for the largest amount that matches the total.
            - "bez DPH" means "without VAT" - DO NOT USE THIS VALUE.
            
        Return ONLY a valid JSON object in the following format:
        {
            "productName": "string",
            "storeName": "string",
            "purchaseDate": "YYYY-MM-DD",
            "price": number | "string",
            "currency": "string",
            "warrantyDurationMonths": number
        }
        
        If a field is missing, use empty string or 0.
        
        Raw text:
        ${text}
        `;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            console.log(`Sending fetch request to ${modelName}...`);

            // Add 45s Timeout to fail gracefully before Edge Function limit (usually 60s)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000);

            try {
                const apiResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const apiData = await apiResponse.json();
                console.log("Gemini Response Status:", apiResponse.status);

                if (!apiResponse.ok) {
                    console.error("Gemini API Error Body:", JSON.stringify(apiData));
                    return new Response(
                        JSON.stringify({ error: `Gemini API Error: ${apiData.error?.message || apiResponse.statusText}` }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                // 4. Parse Response
                const textResponse = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!textResponse) {
                    console.error("Unexpected API Response:", JSON.stringify(apiData));
                    return new Response(
                        JSON.stringify({ error: "Empty response from AI" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                let data;
                try {
                    data = JSON.parse(cleanJson);
                } catch (e) {
                    console.error("JSON Parse Error:", cleanJson);
                    data = { error: "Failed to parse AI JSON", raw: cleanJson };
                }

                return new Response(
                    JSON.stringify(data),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
                )
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    console.error("Gemini Request Timed Out (45s)");
                    return new Response(
                        JSON.stringify({ error: "AI Request Timed Out" }),
                        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
                throw fetchError;
            }
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
