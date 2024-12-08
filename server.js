const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Add these environment variables
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://yourusername.github.io';

// Update CORS configuration
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Fact checking endpoint using a simpler approach with free model
app.post('/api/fact-check', async (req, res) => {
    try {
        const { statement, topic } = req.body;

        // Using HuggingFace's free inference API
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
            {
                headers: {
                    "Authorization": "Bearer hf_abcd1234..." // Replace with your actual token
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: statement,
                    parameters: {
                        candidate_labels: ["true", "false", "uncertain"]
                    }
                }),
            }
        );

        const result = await response.json();

        // Process the result
        const isFactual = result.labels[0] === "true";
        let explanation = "Based on analysis of the statement";
        
        // Create a more detailed explanation based on the confidence scores
        if (result.scores[0] > 0.7) {
            explanation += " with high confidence";
        } else if (result.scores[0] > 0.5) {
            explanation += " with moderate confidence";
        } else {
            explanation += " with low confidence";
        }

        const factCheckResult = {
            isFactual: isFactual,
            explanation: explanation,
            sources: "Analysis performed using natural language processing"
        };

        res.json(factCheckResult);

    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            error: 'Error checking fact', 
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 