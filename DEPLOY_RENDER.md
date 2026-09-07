# Guida al deploy su Render.com — Netflix Clone (FastAPI + React + SQLite)

Questa guida usa una configurazione **single-service**: un unico Web Service su Render ospita sia il backend FastAPI che il frontend React buildato. Il backend serve direttamente i file statici di produzione, quindi frontend e backend condividono lo stesso dominio e **non servono chiamate cross-origin nè CORS aggiuntivi**.

Struttura del repository:

- `backend/` → FastAPI + SQLite
- `frontend/` → React + Vite

---

## ⚠️ Stato attuale — deploy sospeso

- Il codice è stato preparato e pushato su `github.com/mauriziocozzetto/netflix-clone-web`.
- Non è stato ancora creato alcun servizio su Render.
- Il deploy è stato sospeso perché, dalla dashboard di Render, tutte le opzioni di creazione servizio mostrano il badge **PRO**. Sarà necessario verificare il piano del workspace Render o valutare un’alternativa gratuita prima di riprendere.
- L’esecuzione in locale continua a funzionare normalmente (vedi sezione [Avvio in locale](#avvio-in-locale)).

**Prossimi passi quando si riprenderà:**
1. Verificare il piano del workspace Render (Billing).
2. Se il piano permette istanze Free, creare un unico Web Service con i parametri indicati in [Deploy su Render](#4-deploy-su-render).
3. Se Render risulta a pagamento, valutare piattaforme alternative (es. Fly.io, Railway, Vercel).

---

## Indice

1. [Prerequisiti](#1-prerequisiti)
2. [Modifiche già applicate al codice](#2-modifiche-già-applicate-al-codice)
3. [Preparazione del repository Git](#3-preparazione-del-repository-git)
4. [Deploy su Render](#4-deploy-su-render)
5. [Verifica finale](#5-verifica-finale)
6. [Troubleshooting](#6-troubleshooting)
7. [Note sui costi e sulla persistenza](#7-note-sui-costi-e-sulla-persistenza)
8. [Avvio in locale](#8-avvio-in-locale)

1. [Prerequisiti](#1-prerequisiti)
2. [Modifiche già applicate al codice](#2-modifiche-già-applicate-al-codice)
3. [Preparazione del repository Git](#3-preparazione-del-repository-git)
4. [Deploy su Render](#4-deploy-su-render)
5. [Verifica finale](#5-verifica-finale)
6. [Troubleshooting](#6-troubleshooting)
7. [Note sui costi e sulla persistenza](#7-note-sui-costi-e-sulla-persistenza)

---

## 1. Prerequisiti

- Account su [render.com](https://render.com).
- Repository GitHub `github.com/mauriziocozzetto/netflix-clone-web` (il codice deve essere già stato pushato).

---

## 2. Modifiche già applicate al codice

Sono state fatte le seguenti modifiche in locale e pushate sul repository:

- **`backend/app/main.py`**:
  - CORS configurato con la variabile `ALLOWED_ORIGINS` (utile solo in sviluppo).
  - Aggiunta la logica per servire il frontend React quando esiste la cartella indicata da `FRONTEND_DIST_PATH`.
- **`frontend/src/services/api.js`**:
  - In sviluppo chiama `http://localhost:8000`.
  - In produzione usa path relativi (stesso dominio del backend).
- **`.gitignore`**:
  - Esclude `venv/`, `node_modules/`, `.env`, build e log.
- **`frontend/public/_redirects`**:
  - Mantenuto per compatibilità con eventuali deploy futuri del frontend su altre piattaforme statiche.

---

## 3. Preparazione del repository Git

Se non l’hai già fatto, il repository dovrebbe contenere il codice aggiornato:

```bash
cd /home/maurizio/Scrivania/netflix-clone
git add .
git commit -m "Single-service Render deploy: backend serves frontend"
git push origin main
```

> **Importante:** `backend/netflix.db` è incluso nel repository, quindi i dati attuali verranno preservati al primo deploy.

---

## 4. Deploy su Render

### 4.1 Crea il Web Service

1. Vai su [dashboard.render.com](https://dashboard.render.com).
2. Entra nel **Project `netflix-clone`** oppure, se continui a vedere il badge **PRO** sul Project, crea il servizio direttamente dallo workspace (clicca **New → Web Service** dalla dashboard principale).
3. Seleziona il repository **`netflix-clone-web`**.
4. Compila i campi:

   | Campo | Valore |
   |-------|--------|
   | **Name** | `netflix-clone` (o nome a piacere) |
   | **Root Directory** | *lascia vuoto* (usa la root del repository) |
   | **Runtime** | `Python 3` |
   | **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt` |
   | **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

5. Clicca **Advanced** e aggiungi le variabili d’ambiente:

   ```env
   DATABASE_URL=sqlite:///./netflix.db
   FRONTEND_DIST_PATH=../frontend/dist
   SECRET_KEY=<stringa lunga e casuale, minimo 32 caratteri>
   TMDB_API_KEY=<la tua API key di TMDB>
   ALLOWED_ORIGINS=http://localhost:5173
   ```

   - `SECRET_KEY`: genera una chiave casuale, non usare il valore di default.
   - `TMDB_API_KEY`: la trovi nel file `backend/.env` che hai in locale (`daf81eb6bb254ac0fbc1698f53b401bf`).
   - `ALLOWED_ORIGINS`: serve solo per lo sviluppo locale; in produzione il backend serve direttamente il frontend.

6. Nella sezione **Instance Type** scegli **Free** (se disponibile).
7. Clicca **Create Web Service**.

### 4.2 Attendi il deploy

Render eseguirà in ordine:

1. Build del frontend React (`npm run build` → `frontend/dist/`).
2. Installazione delle dipendenze Python.
3. Avvio di FastAPI, che serve sia le API che i file statici del frontend.

L’URL sarà qualcosa come:

```text
https://netflix-clone.onrender.com
```

---

## 5. Verifica finale

1. Apri l’URL del servizio, ad esempio `https://netflix-clone.onrender.com`.
2. Prova a:
   - registrarti / fare login;
   - navigare nella home;
   - aggiungere un film o una serie alla “My List”;
   - ricaricare la pagina `/my-list` (deve funzionare).
3. Verifica che l’API di health funzioni:

   ```text
   https://netflix-clone.onrender.com/health
   ```

   Dovresti vedere:

   ```json
   {"status":"ok"}
   ```

4. Se qualcosa non funziona, controlla i log nella dashboard di Render.

---

## 6. Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| Pagina bianca dopo login | Cookie non inviato correttamente | Verifica che il frontend e il backend siano sullo stesso dominio (lo sono con questa configurazione). |
| `404` su `/my-list` al refresh | Catch-all non attivo | Verifica che `FRONTEND_DIST_PATH=../frontend/dist` sia impostata e che `frontend/dist` esista dopo la build. |
| I dati iniziali non ci sono | `netflix.db` non è nel repository | Pusha `backend/netflix.db` e fai un redeploy. |
| I dati nuovi scompaiono | Filesystem effimero del piano gratuito | Normale nel piano gratuito; vedi la sezione successiva. |
| Build fallisce su `npm run build` | Dipendenze frontend rotte | Prova a cancellare `frontend/package-lock.json` e `frontend/node_modules` in locale, poi `npm install` e `npm run build`. |

---

## 7. Note sui costi e sulla persistenza

- **Piano gratuito Render:** il Web Service Free funziona senza costi, ma si "addormenta" dopo 15 minuti di inattività e impiega qualche secondo a risvegliarsi.
- **Filesystem effimero:** le modifiche al database SQLite persistono solo finché il container è attivo. Al prossimo deploy o spin-down, il database torna allo stato del file nel repository (dati iniziali preservati).
- **Persistenza permanente:** se vuoi mantenere i dati anche dopo i redeploy, devi usare un **Render Disk** (a pagamento) o migrare a **PostgreSQL**.

---

## 8. Avvio in locale

L’app continua a funzionare normalmente in locale. Assicurati che il backend e il frontend siano avviati su due terminali diversi.

### Backend (FastAPI)

```bash
cd /home/maurizio/Scrivania/netflix-clone/backend
source ../venv/bin/activate
uvicorn app.main:app --reload
```

Il backend sarà disponibile su `http://localhost:8000`.

Il CORS locale è già configurato per accettare il frontend su `http://localhost:5173`.

### Frontend (React + Vite)

```bash
cd /home/maurizio/Scrivania/netflix-clone/frontend
npm install   # solo se mancano i moduli
npm run dev
```

Il frontend sarà disponibile su `http://localhost:5173`.

In modalità sviluppo `frontend/src/services/api.js` punta automaticamente a `http://localhost:8000`.

---

**Buon deploy!** L’app sarà online su un unico dominio Render.
