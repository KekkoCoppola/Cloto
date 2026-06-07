<div align="center">
  <br />
  <img src="src/assets/logo/NoBG.png" alt="Cloto Logo" width="180" />
  <br /><br />

  <h1>Cloto</h1>
  <h3>Assistente AI per guidare la scrittura di un curriculum, estrarre competenze dalle risposte e mantenere una memoria strutturata.</h3>
</div>

## Caratteristiche

- **Interazione guidata**: Cloto fa una domanda alla volta e cerca dettagli concreti su ruolo, impatto, strumenti e risultati.
- **Memoria persistente**: lo stato del CV viene salvato localmente in SQLite lato server.
- **Memoria strutturata**: dati personali, esperienze, formazione, competenze tecniche, competenze trasversali, lingue, certificazioni, progetti, extra e domande aperte.
- **Hardening anti prompt-injection**: l'input utente viene trattato come dato non fidato e il server valida gli aggiornamenti prima di salvarli.
- **Progetto free/open source**: nessun database cloud, vector DB commerciale, fine-tuning o provider LLM aggiuntivo.

## Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Express
- **AI Engine**: Google Gemini via `@google/genai`
- **Memoria locale**: SQLite integrato in Node.js (`node:sqlite`)

## Requisiti

- Node.js 24+
- Una API key Gemini compatibile con il piano Google AI Pro disponibile all'utente

## Installazione

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Copia `.env.example` in `.env`.
3. Inserisci `GEMINI_API_KEY`.

## Sviluppo

```bash
npm run dev
```

Il backend usa `data/cloto.sqlite` per salvare sessioni, messaggi e memoria CV. La cartella `data/` e ignorata da Git per evitare di committare dati personali.

## Validazione

```bash
npm run lint
```

## Vincoli

- Non usare servizi a pagamento oltre alla API Gemini prevista.
- Non aggiungere provider LLM diversi da Gemini.
- Non introdurre fine-tuning, embedding cloud o vector database commerciali.
- La generazione LaTeX e prevista come fase successiva.
