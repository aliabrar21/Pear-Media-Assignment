const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const sharp = require('sharp');
const { OpenAI, toFile } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI with dummy key if not found, to prevent crash on startup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-update-in-env',
});

// Configure Multer for handling file uploads (stored in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Basic health check
app.get('/', (req, res) => {
  res.send('AI Image & Text Generator API is running!');
});

// Helper to extract OpenAI specific error messages
const getOpenAIError = (error) => {
  if (error.status === 401) return 'Invalid OpenAI API Key. Please check the server/.env file.';
  if (error.error && error.error.message) return error.error.message;
  return error.message || 'An unknown error occurred.';
};

/**
 * POST /api/enhance-text
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
    res.status(500).json({ error: getOpenAIError(error) });
  }
});

/**
 * POST /api/generate-image
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
    res.status(500).json({ error: getOpenAIError(error) });
  }
});

/**
 * POST /api/analyze-image
 */
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image. Provide a detailed caption describing what you see, and list the main objects detected in the image as a JSON array. Return exactly this JSON structure: {"caption": "...", "objects": ["...", "..."]}. Do not wrap in markdown tags like ```json. Keep the caption concise.' },
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
    res.status(500).json({ error: getOpenAIError(error) });
  }
});

/**
 * POST /api/generate-variations
 * Uses 'sharp' to ensure the image meets OpenAI's Square PNG requirements!
 */
app.post('/api/generate-variations', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    // Use Sharp to convert the uploaded arbitrary image into a 1024x1024 PNG (Center-Cover cropped)
    const formattedImageBuffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'cover' })
      .png()
      .toBuffer();

    // Convert sharp buffer to OpenAI format
    const file = await toFile(formattedImageBuffer, 'image.png', { type: 'image/png' });

    const response = await openai.images.createVariation({
      image: file,
      n: 1,
      size: '1024x1024',
    });

    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Generate Variations Error:', error);
    res.status(500).json({ error: getOpenAIError(error) });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
