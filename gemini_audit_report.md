# Gemini Audit Report - Cloto Project

Questo report analizza l'integrazione dell'API Gemini nel progetto "Cloto", identificando criticità tecniche, di sicurezza e di resilienza.

## Riepilogo delle Criticità

| Severità | Descrizione | Stato |
| :--- | :--- | :--- |
| **CRITICAL** | Esposizione API Key nel Client Bundle | Rilevato |
| **CRITICAL** | Assenza di Meccanismi di Retry (Resilienza) | Rilevato |
| **HIGH** | Estrazione JSON Fragile e Non Gestita | Rilevato |
| **MEDIUM** | Vulnerabilità potenziale a Prompt Injection | Rilevato |
| **LOW** | Configurazione Ambiente non Standard (Vite) | Rilevato |

---

## 1. CRITICAL: Esposizione API Key nel Client Bundle

**Descrizione**: In `vite.config.ts`, la chiave API `GEMINI_API_KEY` viene iniettata nel codice sorgente tramite la clausola `define`. Questo significa che il valore della chiave viene "hardcodato" nel file JavaScript finale distribuito al browser. Qualunque utente può ispezionare il codice e rubare la chiave.
**File coinvolti**: `vite.config.ts`, `src/App.tsx`.

### Soluzione (Refactoring)
È necessario utilizzare un proxy backend o, se l'app è puramente client-side per scopi dimostrativi, avvisare che la chiave è esposta. Tuttavia, la soluzione corretta è centralizzare le chiamate.

```typescript
// Refactoring suggerito in vite.config.ts: Rimuovere la clausola define per la chiave API.
// Utilizzare invece un servizio backend o istruzioni per l'Off-Device processing.
```

---

## 2. CRITICAL: Assenza di Meccanismi di Retry (Resilienza)

**Descrizione**: Le chiamate `chat.sendMessage` sono soggette a rate limiting (429) o errori temporanei del server (500/503). Attualmente, un singolo fallimento interrompe l'esperienza utente.
**File coinvolti**: `src/App.tsx`.

### Soluzione (Bash Script per Refactoring)
Questo script applica una logica di retry esponenziale alla funzione `handleSend`.

```bash
# Esegui questo script per applicare il refactoring dei retry
cat <<EOF > apply_retry.js
const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const retryLogic = \`
  const sendMessageWithRetry = async (chat, message, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await chat.sendMessage({ message });
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  };
\`;

// Iniezione della funzione e sostituzione delle chiamate
let newContent = content.replace('const handleSend = async () => {', retryLogic + '\n  const handleSend = async () => {');
newContent = newContent.replace('chatSession.sendMessage({ message: userMsg })', 'sendMessageWithRetry(chatSession, userMsg)');

fs.writeFileSync('src/App.tsx', newContent);
EOF

node apply_retry.js
rm apply_retry.js
```

---

## 3. HIGH: Estrazione JSON Fragile e Non Gestita

**Descrizione**: La funzione `extractJsonAndText` utilizza una regex statica per estrarre lo stato della memoria. Se Gemini non chiude correttamente i backtick o produce testo aggiuntivo neanche previsto, il parsing fallisce silenziosamente o corrompe il progresso.
**File coinvolti**: `src/App.tsx` (riga 80).

---

## 4. MEDIUM: Vulnerabilità potenziale a Prompt Injection

**Descrizione**: L'input dell'utente viene passato direttamente al modello senza alcuna sanitizzazione o wrapping in un contesto di "user message" isolato (es. appendere una stringa di chiusura o istruzioni di non-esecuzione).

---

## 5. LOW: Configurazione Ambiente non Standard (Vite)

**Descrizione**: L'uso di `process.env` in Vite richiede configurazioni extra in `vite.config.ts`. La convenzione ufficiale prevede `import.meta.env` con prefisso `VITE_`.
