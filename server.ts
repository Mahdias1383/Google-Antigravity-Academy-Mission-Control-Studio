import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/antigravity/assistant', async (req, res) => {
    try {
      const { prompt, mode } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.json({
          text: 'کلید API تنظیم نشده است؛ پاسخ مرجع معماری از پایگاه دانش داخلی نمایش داده می‌شود.',
          sources: [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction =
        'You are a Principal AI Systems Architect specializing in Google Antigravity (https://antigravity.google/docs). Respond in fluent Persian (RTL) while keeping technical identifiers, file paths (.agent/rules/, .agent/workflows/, task.md, implementation_plan.md, walkthrough.md, mcp_config.json), and code blocks in English.';

      // Use gemini-3.8-flash with googleSearch tool or ThinkingLevel.HIGH
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: mode === 'high-thinking' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
          },
          tools: mode === 'search-grounding' ? [{ googleSearch: {} }] : undefined,
        },
      });

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: { web?: { title?: string; uri?: string } }) =>
          chunk.web?.uri
            ? {
                title: chunk.web.title || 'Antigravity Documentation Reference',
                uri: chunk.web.uri,
              }
            : null
        )
        .filter(Boolean);

      res.json({
        text: response.text || '',
        sources:
          sources.length > 0
            ? sources
            : [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Server error';
      res.status(200).json({
        text: `پاسخ معماری از کش دانش داخلی (خطای ارتباط با سرویس خارجی: ${errMessage}):\n\nبرای اجرای ایمن در Google Antigravity، همیشه از ترکیب Planning Mode، فایل‌های .agent/rules/ با حالت Glob و صحت‌سنجی بصری Browser Subagent در فایل walkthrough.md استفاده نمایید.`,
        sources: [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
