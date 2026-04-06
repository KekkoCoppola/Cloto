import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../constants/prompts';
import { withRetry } from '../utils/retry';
import { GeminiResponse } from '../types';

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
        extra: { type: 'string' }
      },
      required: ['dati_personali', 'esperienze', 'formazione', 'competenze', 'extra']
    },
    answer: { type: 'string', description: 'La tua risposta testuale per l\'utente' },
    is_cv_complete: { type: 'boolean', description: 'True se il CV è pronto per la generazione' }
  },
  required: ['progress', 'memory', 'answer', 'is_cv_complete']
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async createChat() {
    return this.ai.chats.create({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA as any,
      },
    });
  }

  async sendMessage(chat: any, message: string): Promise<GeminiResponse> {
    const wrappedMessage = `<user_input>${message}</user_input>`;
    const response = await withRetry(() => chat.sendMessage({ message: wrappedMessage }));
    return JSON.parse(response.text);
  }
}
