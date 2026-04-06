export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
}

export interface MemoryState {
  dati_personali: string;
  esperienze: string;
  formazione: string;
  competenze: string;
  extra: string;
}

export interface GeminiResponse {
  progress: number;
  memory: MemoryState;
  answer: string;
  is_cv_complete: boolean;
}
