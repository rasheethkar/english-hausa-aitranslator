import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { translateToHausa, getProviderStatus } from './src/server/translator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Status & Configuration Endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  try {
    const status = getProviderStatus();
    res.json({
      success: true,
      status,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Curated realistic samples for language learners & communicators
app.get('/api/samples', (_req: Request, res: Response) => {
  res.json({
    success: true,
    samples: [
      {
        category: 'Proverb & Idiom',
        title: "Don't count chickens before they hatch",
        text: "Don't count your chickens before they hatch. Be patient and wait until everything is certain.",
        tone: 'Proverbial / Wise',
        audience: 'General / Storytelling',
      },
      {
        category: 'Daily Greeting & Etiquette',
        title: 'Morning greeting to a host',
        text: 'Good morning! How did you sleep? I hope you and your family are in good health.',
        tone: 'Respectful & Polite',
        audience: 'Elder or Host',
      },
      {
        category: 'Customer Support',
        title: 'Service delay apology',
        text: 'We sincerely apologize for the delay. We are working hard to resolve your issue right away.',
        tone: 'Professional & Empathetic',
        audience: 'Customer Support',
      },
      {
        category: 'Market & Everyday Colloquial',
        title: 'Meeting at the market',
        text: "Are you free this afternoon? Let's meet at the market to pick up fresh food and spices.",
        tone: 'Casual & Friendly',
        audience: 'Friend / Colleague',
      },
      {
        category: 'Warm Hospitality',
        title: 'Thanking host for warm meal',
        text: 'Thank you very much for your warm hospitality and delicious meal. May God bless your home.',
        tone: 'Honorific & Grateful',
        audience: 'Community / Host Family',
      },
    ],
  });
});

// Main Translation Endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { text, provider, tonePreference, targetAudience } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid English text to translate.',
      });
    }

    const result = await translateToHausa(text, {
      provider,
      tonePreference,
      targetAudience,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during translation.',
    });
  }
});

// Setup frontend serving
async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const status = getProviderStatus();
    console.log(`=======================================================`);
    console.log(`  GemmaHausa Translator Server running on port ${PORT}`);
    console.log(`  Active Provider : ${status.activeProvider.toUpperCase()}`);
    console.log(`  API Model       : ${status.apiModel}`);
    console.log(`  Ollama Model    : ${status.ollamaModel} (${status.ollamaBaseUrl})`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
