require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { TwitterApi } = require('twitter-api-v2');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Twitter v2 Client
const token = process.env.TWITTER_BEARER_TOKEN;
const readOnlyClient = token ? new TwitterApi(token).readOnly : null;

// Helper: Run Python Predictor (Returns { code, raw_output })
const getPythonSentiment = (text) => {
    return new Promise((resolve, reject) => {
        const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
        const scriptPath = path.join(__dirname, '../ml/predict.py');
        
        exec(`python3 "${scriptPath}" "${escapedText}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Exec Error:", stderr);
                return resolve({ sentiment: "Neutral", score: 2 });
            }
            const code = parseInt(stdout.trim());
            const mapping = { 
                1: { label: "Positive", score: 5 }, 
                0: { label: "Negative", score: 1 }, 
                2: { label: "Neutral", score: 3 }, 
                3: { label: "Toxic", score: 0 } 
            };
            const result = mapping[code] || { label: "Neutral", score: 3 };
            resolve({ sentiment: result.label, score: result.score });
        });
    });
};

// --- UPDATED ROUTES TO MATCH FRONTEND (/api prefix) ---

// Route 1: Manual Analysis
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text is required" });
        
        const result = await getPythonSentiment(text);
        console.log(`Input: ${text.substring(0, 20)}... | Result: ${result.sentiment}`);
        
        res.json({ text, sentiment: result.sentiment.toLowerCase(), score: result.score });
    } catch (err) {
        console.error("Route Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route 2: Fetch Tweets Only
app.get('/api/fetch-tweets', async (req, res) => {
    const keyword = req.query.keyword || 'AI';
    try {
        if (!readOnlyClient) throw new Error("No Token");
        const search = await readOnlyClient.v2.search(keyword, { max_results: 10 });
        const tweets = search.data.data.map(t => t.text);
        res.json(tweets);
    } catch (err) {
        res.json([
            "I love the new AI features! Amazing work.",
            "This product is absolutely trash, hate the new update.",
            "The service was just okay today.",
            "You are a stupid idiot trash for saying that."
        ]);
    }
});

// Route 3: Live Analyze
app.get('/api/analyze-live', async (req, res) => {
    const keyword = req.query.keyword || 'Apple';
    try {
        let tweets = [];
        try {
            if (!readOnlyClient) throw new Error();
            const search = await readOnlyClient.v2.search(keyword, { max_results: 5 });
            tweets = search.data.data.map(t => t.text);
        } catch {
            tweets = ["Great product!", "Worst experience.", "It's okay."];
        }

        const results = await Promise.all(tweets.map(async (t) => {
            const res = await getPythonSentiment(t);
            return { text: t, sentiment: res.sentiment.toLowerCase(), score: res.score };
        }));

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 API Sync Complete on http://localhost:${PORT}/api`);
});
