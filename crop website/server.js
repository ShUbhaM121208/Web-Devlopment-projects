// noconst express = require('express');
const express = require('express');

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public folder

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

// Function to handle chat interaction using Google Gemini API
async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // Add more safety settings if needed
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: userInput }],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;

  // Replace newline characters with double newlines to add space between paragraphs
  const formattedResponse = response.text().replace(/\n/g, '\n\n');

  return formattedResponse;
}

// Serve the main chat page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html')); // Point to your chat.html
});

// API endpoint to process chat messages
app.post('/api/send-message', async (req, res) => {
  try {
    const userInput = req.body.message; // Assuming the request body contains the 'message'
    console.log('Incoming message:', userInput);

    if (!userInput) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Get the AI's response
    const response = await runChat(userInput);

    // Send the response back to the frontend
    res.json({ reply: response });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Failed to get a response from Gemini' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
