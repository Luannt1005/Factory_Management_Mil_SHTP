/**
 * scripts/antigravity_web_tester.js
 * 
 * Antigravity Web E2E / UI Testing Bridge for Claude
 * Enables Claude to automatically trigger web tests,
 * uses Gemini (via API) to inspect DOM / HTTP / Auth responses
 * and returns a concise, token-saving report (<15 lines).
 * 
 * Usage:
 *   node scripts/antigravity_web_tester.js <route> [action]
 * Example:
 *   node scripts/antigravity_web_tester.js /login test_admin
 *   node scripts/antigravity_web_tester.js /visitoradmin check
 */

const fs = require('fs');
const path = require('path');

function getApiKey() {
    let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (trimmed.startsWith('GEMINI_API_KEY=')) {
                    key = trimmed.split('=')[1].trim();
                    break;
                } else if (trimmed.startsWith('GOOGLE_API_KEY=')) {
                    key = trimmed.split('=')[1].trim();
                }
            }
        }
    }
    return key;
}

async function analyzeWithGemini(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return '[Error]: GEMINI_API_KEY not found in .env.local';
    }

    const modelsToTry = [
        'models/gemini-flash-latest',
        'models/gemini-3.8-flash',
        'models/gemini-flash-lite-latest'
    ];

    for (const model of modelsToTry) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 600
                    }
                })
            });

            const data = await res.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return data.candidates[0].content.parts[0].text.trim();
            }
        } catch (e) {
            // try next model
        }
    }

    return '[Gemini Analysis]: Unable to query Gemini models at this moment.';
}

async function testWebRoute() {
    const route = process.argv[2] || '/login';
    const action = process.argv[3] || 'check';
    const baseUrl = 'http://localhost:3001';
    const targetUrl = `${baseUrl}${route.startsWith('/') ? route : '/' + route}`;

    console.log(`[Antigravity Web Tester] Target URL: ${targetUrl} (Action: ${action})`);

    try {
        const pageRes = await fetch(targetUrl);
        const status = pageRes.status;
        const html = await pageRes.text();

        let authDetails = 'None';
        if (route === '/login' && (action === 'test_admin' || action === 'login')) {
            try {
                const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
                const csrfData = await csrfRes.json();
                const csrfCookie = csrfRes.headers.get('set-cookie') || '';

                const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': csrfCookie
                    },
                    body: new URLSearchParams({
                        csrfToken: csrfData.csrfToken,
                        username: 'admin',
                        password: '123456',
                        json: 'true'
                    })
                });

                const loginData = await loginRes.json();
                authDetails = `HTTP ${loginRes.status} -> ${loginData.url || JSON.stringify(loginData)}`;
            } catch (authErr) {
                authDetails = `Auth Error: ${authErr.message}`;
            }
        }

        const prompt = `You are an automated Web Testing Agent in Antigravity.
Analyze the following web test results for route "${route}" and synthesize a compact report strictly under 15 lines so Claude receives minimal tokens.

Route Tested: ${route}
HTTP Status: ${status}
Action: ${action}
Auth Execution: ${authDetails}
HTML Title/Snippet:
${html.slice(0, 3000)}

Please output strictly in this markdown format:
### [Antigravity Web Test Report for Claude]
- Route: ${route}
- HTTP Status: ${status}
- Page Render: <PASS / FAIL with 1-sentence note>
- Feature Verification: <Result of action '${action}'>
- UI Elements Identified: <Inputs, Buttons, Headers found>
- Next Steps / Diagnostics: <1-2 sentences recommendation for Claude>
`;

        const summary = await analyzeWithGemini(prompt);
        console.log('\n' + summary + '\n');

    } catch (err) {
        console.error(`\n### [Antigravity Web Test Error]\nFailed to reach ${targetUrl}.\nError: ${err.message}\n`);
    }
}

testWebRoute();
