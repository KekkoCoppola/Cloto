# Cloto - Career Coach AI & CV Expert

**Cloto** è un assistente intelligente progettato per guidarti passo dopo passo nella creazione di un curriculum vitae perfetto. Agisce come un recruiter esperto, estrapolando valore dalle tue esperienze lavorative e strutturandole in modo professionale.

---

## 🌟 Caratteristiche Principali

- **Interazione Intelligente**: Cloto analizza le tue risposte e pone domande mirate per valorizzare mansioni e risultati.
- **Memoria Strutturata**: L'agente mantiene uno stato interno suddiviso in blocchi (Dati, Esperienze, Formazione, Competenze, Extra).
- **Generazione Markdown**: Una volta raccolte tutte le informazioni, Cloto genera un CV completo pronto per essere esportato.
- **Resilienza Avanzata**: Integrazione sicura con Gemini AI, dotata di meccanismi di retry e gestione strutturata dell'output.

## 🛠️ Stack Tecnologico

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animazioni**: [Framer Motion](https://www.framer.com/motion/)
- **Icone**: [Lucide React](https://lucide.dev/)
- **AI Engine**: [Google Gemini 1.5 Flash](https://aistudio.google.com/) via `@google/genai`

## 🚀 Inizio Rapido

### Requisiti
- Node.js 18+
- Una API Key di Google Gemini

### Installazione
1. Scarica o clona il repository.
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le variabili d'ambiente:
   - Copia `.env.example` in `.env`.
   - Inserisci la tua `VITE_GEMINI_API_KEY`.

### Sviluppo
Lancia il progetto in locale:
```bash
npm run dev
```

---

## 🔒 Sicurezza e Best Practices
Il progetto è stato sottoposto a un audit completo per garantire:
- **Protezione Segreti**: Nessuna chiave API è hardcoded nel repository.
- **Structured Output**: Uso di JSON Schema per risposte deterministiche dall'IA.
- **Robustezza**: Gestione degli errori lato client con exponential backoff.

---

## 📄 Licenza
Questo progetto è rilasciato sotto licenza MIT.
