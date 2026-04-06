import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYSTEM_PROMPT } from './src/constants/prompts';
import type { GeminiResponse } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Guard: fail fast if API key is missing ────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('[server] FATAL: GEMINI_API_KEY environment variable is not set.');
  console.error('[server] Copy .env.example to .env and add your key.');
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 4000);

// ── Gemini setup (server-side only — key never reaches the browser) ───────────
const ai = new GoogleGenAI({ apiKey });

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    progress: { type: 'number', description: 'Percentuale di completamento totale (0-100)' },
    memory: {
      type: 'object',
      properties: {
        dati_personali: { type: 'string' },
        esperienze: { type: 'string' },
        formazione: { type: 'string' },
        competenze: { type: 'string' },
        extra: { type: 'string' },
      },
      required: ['dati_personali', 'esperienze', 'formazione', 'competenze', 'extra'],
    },
    answer: { type: 'string', description: 'La risposta testuale per l\'utente' },
    is_cv_complete: { type: 'boolean', description: 'True se il CV è pronto per la generazione' },
  },
  required: ['progress', 'memory', 'answer', 'is_cv_complete'],
};

// ── M-2: Runtime response validation ─────────────────────────────────────────
// TypeScript type assertions are compile-time only. This guard validates the
// actual JSON shape at runtime before we trust it, catching safety-filtered
// or malformed responses that would otherwise silently propagate as undefined.
function assertGeminiResponse(obj: unknown): asserts obj is GeminiResponse {
  const r = obj as Record<string, unknown>;
  if (
    typeof obj !== 'object' ||
    obj === null ||
    typeof r.answer !== 'string' ||
    typeof r.progress !== 'number' ||
    typeof r.is_cv_complete !== 'boolean' ||
    typeof r.memory !== 'object' ||
    r.memory === null
  ) {
    throw new Error(
      `Gemini API returned an unexpected response shape. ` +
      `Received: ${JSON.stringify(obj).slice(0, 200)}`,
    );
  }
}

// ── M-1: Session store with TTL to prevent memory leak ───────────────────────
interface SessionEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chat: any;
  lastAccess: number; // epoch ms of last activity
}

const chatSessions = new Map<string, SessionEntry>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity → evict

function pruneExpiredSessions(): void {
  const now = Date.now();
  let pruned = 0;
  for (const [id, entry] of chatSessions) {
    if (now - entry.lastAccess > SESSION_TTL_MS) {
      chatSessions.delete(id);
      pruned++;
    }
  }
  if (pruned > 0) {
    console.log(`[server] Pruned ${pruned} expired session(s). Active: ${chatSessions.size}`);
  }
}

// Run cleanup every 5 minutes. unref() so it doesn't block process exit.
setInterval(pruneExpiredSessions, 5 * 60 * 1000).unref();

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

// M-3: Explicit CORS — only requests from the configured APP_URL are allowed.
// In development (APP_URL not set) falls back to the Vite dev server origin.
const allowedOrigin = process.env.APP_URL ?? 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(express.json({ limit: '16kb' }));

/**
 * POST /api/chat/create
 * Creates a new Gemini chat session, fires the initial greeting message,
 * and returns the sessionId + first AI response.
 */
app.post('/api/chat/create', async (_req: Request, res: Response) => {
  try {
    const sessionId = crypto.randomUUID();

    const chat = await ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA as any,
      },
    });

    // M-1: store alongside creation timestamp
    chatSessions.set(sessionId, { chat, lastAccess: Date.now() });

    const initial = '<user_input>Ciao! Vorrei iniziare a creare il mio CV.</user_input>';
    const response = await chat.sendMessage({ message: initial });

    // M-2: validate shape before trusting the response
    const raw: unknown = JSON.parse(response.text);
    assertGeminiResponse(raw);

    res.json({ sessionId, data: raw });
  } catch (err) {
    console.error('[server] /api/chat/create error:', err);
    res.status(500).json({ error: 'Failed to initialize chat session.' });
  }
});

/**
 * POST /api/chat/message
 * Sends a user message to an existing session and returns the AI response.
 * Body: { sessionId: string, message: string }
 */
app.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body as { sessionId?: string; message?: string };

    if (!sessionId || !message) {
      res.status(400).json({ error: 'sessionId and message are required.' });
      return;
    }

    const entry = chatSessions.get(sessionId);
    if (!entry) {
      res.status(404).json({ error: 'Session not found or expired. Please refresh.' });
      return;
    }

    // M-1: refresh lastAccess on every successful interaction
    entry.lastAccess = Date.now();

    // Wrap user input to mitigate prompt injection (server-side)
    const wrapped = `<user_input>${message}</user_input>`;
    const response = await entry.chat.sendMessage({ message: wrapped });

    // M-2: validate shape before trusting the response
    const raw: unknown = JSON.parse(response.text);
    assertGeminiResponse(raw);

    res.json(raw);
  } catch (err) {
    console.error('[server] /api/chat/message error:', err);
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

// ── Static file serving in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] Cloto backend running on http://localhost:${PORT}`);
  console.log(`[server] CORS allowed origin: ${allowedOrigin}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[server] Dev mode: frontend served by Vite on http://localhost:3000');
  }
});
