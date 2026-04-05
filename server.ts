import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateText, Output } from 'ai';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// AI API Routes

// Generate character
app.post('/api/ai/generate-character', async (req, res) => {
  console.log('[v0] /api/ai/generate-character called with body:', req.body);
  try {
    const { genre = 'fantasy' } = req.body;
    
    console.log('[v0] Calling generateText for character generation...');
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: z.object({
          name: z.string().describe('A unique character name'),
          role: z.string().describe('The character role (e.g., Protagonist, Antagonist, Supporting)'),
          description: z.string().describe('A brief character description, max 200 characters'),
          quirk: z.string().describe('A unique character quirk or trait, max 100 characters'),
        }),
      }),
      prompt: `Generate a unique and interesting character for a ${genre} story. Be creative with names, backstories, and personalities. Make the character feel original and compelling.`,
    });

    console.log('[v0] Character generated successfully:', output);
    res.json({ success: true, character: output });
  } catch (error: any) {
    console.error('[v0] Error generating character:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate character'
    });
  }
});

// Generate plot suggestion
app.post('/api/ai/generate-plot', async (req, res) => {
  console.log('[v0] /api/ai/generate-plot called');
  try {
    const { context = '', genre = 'fantasy' } = req.body;
    
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: z.object({
          title: z.string().describe('A short title for the plot point, max 50 characters'),
          content: z.string().describe('The plot content or description, max 300 characters'),
        }),
      }),
      prompt: `Based on the following story context, suggest a new interesting plot branch or twist for a ${genre} story.
      
Context:
${context || 'A new story is beginning...'}

Generate a creative and engaging plot point that would add depth to the narrative.`,
    });

    res.json({ success: true, plot: output });
  } catch (error: any) {
    console.error('Error generating plot:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate plot'
    });
  }
});

// Generate writing suggestions
app.post('/api/ai/writing-suggest', async (req, res) => {
  console.log('[v0] /api/ai/writing-suggest called with type:', req.body.type);
  try {
    const { content, type = 'continuation', genre = 'fantasy' } = req.body;
    
    let prompt = '';
    if (type === 'continuation') {
      prompt = `Continue this ${genre} story in a compelling way. Write 2-3 sentences that flow naturally from the existing text.

Story so far:
${content}

Continue the story:`;
    } else if (type === 'improve') {
      prompt = `Improve and enhance this ${genre} story passage. Make the writing more vivid, engaging, and emotionally resonant while maintaining the original meaning and style.

Original text:
${content}

Improved version:`;
    } else if (type === 'dialogue') {
      prompt = `Generate natural, character-appropriate dialogue that fits the scene. Write 2-3 lines of dialogue with brief action beats.

Scene context:
${content}

Dialogue:`;
    }
    
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 500,
    });

    res.json({ success: true, suggestion: text });
  } catch (error: any) {
    console.error('Error generating suggestion:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate suggestion'
    });
  }
});

// Generate portrait description (for use with placeholder images)
app.post('/api/ai/portrait-description', async (req, res) => {
  console.log('[v0] /api/ai/portrait-description called for:', req.body.characterName);
  try {
    const { characterName, characterDescription, style = 'Digital Art' } = req.body;
    
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: z.object({
          visualDescription: z.string().describe('A detailed visual description of the character portrait'),
          seedKeywords: z.array(z.string()).describe('Keywords for generating a placeholder image seed'),
        }),
      }),
      prompt: `Create a detailed visual description for a character portrait.

Character Name: ${characterName}
Character Description: ${characterDescription}
Artistic Style: ${style}

Describe how this character would look in a portrait, including physical features, expression, lighting, and atmosphere.`,
    });

    res.json({ success: true, portrait: output });
  } catch (error: any) {
    console.error('Error generating portrait description:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate portrait description'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
