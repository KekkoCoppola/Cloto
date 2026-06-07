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
  competenze_tecniche: string;
  competenze_trasversali: string;
  lingue: string;
  certificazioni: string;
  progetti: string;
  extra: string;
  lacune_domande: string;
}

export interface GeminiResponse {
  progress: number;
  memory: MemoryState;
  answer: string;
  is_cv_complete: boolean;
  next_focus: keyof MemoryState | 'cv_review';
  warnings: string[];
}
