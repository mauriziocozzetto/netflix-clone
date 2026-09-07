# Deploy: Frontend su Vercel + Backend su Render

Questa guida configura il progetto in modalità **multi-servizio**:

- **Frontend** (React + Vite) → [Vercel](https://vercel.com)
- **Backend** (FastAPI + SQLite) → [Render](https://render.com)

> L’esecuzione **in locale** resta completamente supportata e invariata: puoi continuare a mostrare il funzionamento dell’app e il codice ai tuoi studenti senza dipendere dal deploy online. Vedi la sezione [Avvio in locale](#6-avvio-in-locale).

I due servizi girano su domini diversi, quindi è necessario configurare correttamente CORS e i cookie di autenticazione cross-site.

---

## Prerequisiti

- Account su [Vercel](https://vercel.com) e su [Render](https://render.com).
- Repository GitHub del progetto già pushato.
- API Key di TMDB (trovi il valore nel file `backend/.env` locale).

---

## 1. Deploy del backend su Render

### 1.1 Crea il Web Service

1. Vai su [dashboard.render.com](https://dashboard.render.com) e clicca **New → Web Service**.
2. Seleziona il repository `netflix-clone-web`.
3. Compila i campi:

   | Campo | Valore |
   |-------|--------|
   | **Name** | `netflix-clone-api` (o nome a piacere) |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. Clicca **Advanced** e aggiungi le variabili d’ambiente:

   ```env
   DATABASE_URL=sqlite:///./netflix.db
   SECRET_KEY=<stringa lunga e casuale, minimo 32 caratteri>
   TMDB_API_KEY=<la tua API key di TMDB>
   ALLOWED_ORIGINS=https://<nome-frontend>.vercel.app
   COOKIE_SECURE=true
   COOKIE_SAMESITE=none
   ```

   - `SECRET_KEY`: genera una chiave casuale forte, non usare il valore di default.
   - `TMDB_API_KEY`: la trovi in `backend/.env` locale.
   - `ALLOWED_ORIGINS`: sostituisci con l’URL effettivo del frontend su Vercel (lo otterrai al punto 2). Se hai più domini (es. preview deployments), separali con la virgola.
   - `COOKIE_SECURE=true` e `COOKIE_SAMESITE=none` sono **obbligatori** perché il cookie di sessione possa essere inviato da un dominio diverso (cross-site) su HTTPS.

5. Scegli l’istanza **Free** (se disponibile) e clicca **Create Web Service**.

### 1.2 Ottieni l’URL del backend

Dopo il deploy, Render ti assegnerà un URL del tipo:

```text
https://netflix-clone-api.onrender.com
```

Prendilo nota: ti servirà per configurare il frontend su Vercel.

---

## 2. Deploy del frontend su Vercel

### 2.1 Importa il progetto

1. Vai su [vercel.com](https://vercel.com) e clicca **Add New → Project**.
2. Seleziona il repository `netflix-clone-web`.
3. Nella schermata di configurazione imposta:

   | Campo | Valore |
   |-------|--------|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Espandi **Environment Variables** e aggiungi:

   ```env
   VITE_API_BASE_URL=https://netflix-clone-api.onrender.com
   ```

   Sostituisci l’URL con quello reale del backend ottenuto al punto 1.2.

5. Clicca **Deploy**.

### 2.2 Ottieni l’URL del frontend

Al termine del deploy Vercel ti mostrerà un URL del tipo:

```text
https://netflix-clone-web.vercel.app
```

### 2.3 Aggiorna le variabili d’ambiente del backend

Torna su Render e assicurati che `ALLOWED_ORIGINS` contenga esattamente l’URL del frontend su Vercel:

```env
ALLOWED_ORIGINS=https://netflix-clone-web.vercel.app
```

Se cambi il dominio del frontend in futuro, aggiorna anche questa variabile e fai un redeploy del backend.

---

## 3. Verifica finale

1. Apri l’URL del frontend su Vercel.
2. Prova a:
   - registrarti / fare login;
   - navigare nella home;
   - aggiungere un film o una serie alla “My List”;
   - ricaricare la pagina `/my-list` (deve funzionare grazie a `vercel.json`).
3. Verifica l’API di health del backend:

   ```text
   https://netflix-clone-api.onrender.com/health
   ```

   Dovresti vedere:

   ```json
   {"status":"ok"}
   ```

---

## 4. Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| `FUNCTION_INVOCATION_FAILED` o build fallita su Vercel | Hai importato il backend come progetto Vercel | Il backend va deployato su Render, non su Vercel. Elimina il progetto backend da Vercel e ricrealo su Render. |
| Pagina bianca dopo login o richieste API non autenticate | Cookie non inviati cross-site | Verifica che `COOKIE_SECURE=true` e `COOKIE_SAMESITE=none` siano impostate su Render, e che l’URL del frontend sia incluso in `ALLOWED_ORIGINS`. |
| Errore CORS nel browser | Origine frontend non autorizzata | Controlla che `ALLOWED_ORIGINS` sul backend corrisponda esattamente all’URL di Vercel (incluso `https://`). |
| `404` al refresh su `/my-list` | Manca la rewrite SPA | Verifica che `frontend/vercel.json` sia presente e che il redeploy sia stato fatto. |
| I dati nuovi scompaiono | Filesystem effimero del piano gratuito Render | Normale nel piano Free: al prossimo spin-down i dati tornano allo stato del `backend/netflix.db` nel repository. |

---

## 5. Note sui costi e sulla persistenza

- **Vercel Hobby**: il piano gratuito include deploy statici/serverless con banda e build limitate; per un progetto personale è solitamente sufficiente.
- **Render Free**: il Web Service Free si "addormenta" dopo 15 minuti di inattività e impiega qualche secondo a risvegliarsi.
- **SQLite su Render**: il database persiste finché il container è attivo. Al prossimo deploy o spin-down, lo stato torna a quello del file `backend/netflix.db` nel repository.
- **Persistenza permanente**: se vuoi mantenere i dati anche dopo i redeploy, valuta di migrare a **PostgreSQL** (Render PostgreSQL o altri servizi come Neon/Supabase).

---

## 6. Avvio in locale

L’app continua a funzionare normalmente in locale.

### Backend

```bash
cd /home/maurizio/Scrivania/netflix-clone/backend
source ../venv/bin/activate
uvicorn app.main:app --reload
```

Disponibile su `http://localhost:8000`.

### Frontend

```bash
cd /home/maurizio/Scrivania/netflix-clone/frontend
npm install
npm run dev
```

Disponibile su `http://localhost:5173`.

---

Buon deploy! 🚀
