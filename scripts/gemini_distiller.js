/**
 * scripts/gemini_distiller.js
 * 
 * Antigravity Gemini Token-Saving Bridge
 * Executes TypeScript check / Next.js build, absorbs giant terminal logs,
 * calls Gemini 3.8 Flash to distill the root cause into a compact report (<80 tokens)
 * so Claude Chat never receives raw terminal noise.
 */

const { execSync } = require('child_process');
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

async function distillErrorWithGemini(rawLog, command) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('\n[Error Distiller] GEMINI_API_KEY not found in environment or .env.local.');
        console.log(rawLog.slice(0, 1000));
        return;
    }

    const prompt = `You are a high-efficiency compiler log distiller.
The following raw terminal log failed for command: "${command}".
Analyze the log, extract the primary root cause, and output a concise report strictly under 15 lines so it uses minimal tokens.

Output format:
### [Gemini Diagnostic Report for Claude]
- Command: ${command}
- Status: FAILED
- Target: <file_path>:<line_number>
- Error Code: <TS or Build error code>
- Root Cause: <Concise 1-sentence technical reason>
- Relevant Code:
  <2-3 lines of code context if identified>
- Recommendation: <1-sentence fix guidance for Claude>

Raw Log:
${rawLog.slice(0, 15000)}
`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 300
                }
            })
        });

        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            console.log('\n' + data.candidates[0].content.parts[0].text.trim() + '\n');
        } else {
            console.log('\n### [Gemini Diagnostic Report]\nFailed to distill log via API. Top 200 chars:\n' + rawLog.slice(0, 200));
        }
    } catch (e) {
        console.error('[Gemini Distiller Network Error]:', e.message);
        console.log(rawLog.slice(0, 500));
    }
}

async function run() {
    const command = process.argv[2] || 'tsc';
    const cmdToRun = command === 'build' ? 'npm run build' : 'npx tsc --noEmit';

    console.log(`[Gemini Bridge] Running verification: ${cmdToRun}...`);
    try {
        const stdout = execSync(cmdToRun, {
            cwd: path.resolve(__dirname, '..'),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`\n[Gemini Verification] SUCCESS: \`${cmdToRun}\` passed with exit code 0.`);
    } catch (err) {
        const rawOutput = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
        await distillErrorWithGemini(rawOutput, cmdToRun);
        process.exit(1);
    }
}

run();
