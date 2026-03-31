const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { OpenAI, toFile } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Multer for handling file uploads (stored in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Basic health check
app.get('/', (req, res) => {
  res.send('AI Image & Text Generator API is running!');
});

/**
 * POST /api/enhance-text
 * Input: { prompt: "a cat" }
 */
app.post('/api/enhance-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI image prompt engineer. Enhance the user prompt into a highly detailed, visually descriptive prompt suitable for an AI image generator like DALL-E or Midjourney. Only return the enhanced prompt text, nothing else.',
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
    });

    res.json({ enhancedPrompt: completion.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Enhance Text Error:', error);
    res.status(500).json({ error: 'Failed to enhance text' });
  }
});

/**
 * POST /api/generate-image
 * Input: { prompt: "enhanced prompt here" }
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });

    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Generate Image Error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

/**
 * POST /api/analyze-image
 * Input: multipart form-data with 'image' file
 */
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    // For OpenAI Vision, we can pass base64
    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image. Provide a detailed caption describing what you see, and list the main objects detected in the image as a JSON array. Return exactly this JSON structure: {"caption": "...", "objects": ["...", "..."]}. Do not wrap in markdown tags like ```json. Also keep the caption very concise.' },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    let resultText = response.choices[0].message.content.trim();
    if(resultText.startsWith('```json')) {
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch(e) {
      parsedResult = { caption: resultText, objects: [] };
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Analyze Image Error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

/**
 * POST /api/generate-variations
 * Input: multipart form-data with 'image' file
 */
app.post('/api/generate-variations', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    // Convert multer buffer to OpenAI File object
    const file = await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype });

    const response = await openai.images.createVariation({
      image: file,
      n: 1,
      size: '1024x1024',
    });

    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Generate Variations Error:', error);
    
    // Check if the error is due to image format or size (must be square PNG <= 4MB)
    if(error.response && error.response.data && error.response.data.error) {
      return res.status(400).json({ error: error.response.data.error.message });
    }
    res.status(500).json({ error: 'Failed to generate variations. Ensure the image is a square PNG under 4MB.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
