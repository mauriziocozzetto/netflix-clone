# Guida al deploy su Render.com — Netflix Clone (FastAPI + React + SQLite)

Questa guida spiega come pubblicare su [Render](https://render.com) l’applicazione fullstack presente in questa cartella:

- **Backend:** FastAPI (`backend/`)
- **Frontend:** React + Vite (`frontend/`)
- **Database:** SQLite (`backend/netflix.db`)

Obiettivo: avere l’app completa funzionante sul web con i dati attuali di SQLite preservati al momento del deploy iniziale.

---

## Indice

1. [Prerequisiti](#1-prerequisiti)
2. [Project o Blueprint?](#2-project-o-blueprint)
3. [Modifiche al codice necessarie](#3-modifiche-al-codice-necessarie)
4. [Preparazione del repository Git](#4-preparazione-del-repository-git)
5. [Deploy del backend](#5-deploy-del-backend)
6. [Deploy del frontend](#6-deploy-del-frontend)
7. [Gestione del database SQLite](#7-gestione-del-database-sqlite)
8. [Verifica finale](#8-verifica-finale)
9. [Troubleshooting](#9-troubleshooting)
10. [Note sui costi e sulla persistenza](#10-note-sui-costi-e-sulla-persistenza)

---

## 1. Prerequisiti

- Account gratuito su [render.com](https://render.com).
- Repository Git (GitHub, GitLab o Bitbucket) che contenga questa cartella.
  > Se il repository è vuoto, segui prima i passi della sezione [4. Preparazione del repository Git](#4-preparazione-del-repository-git) per caricare il codice.
- Node.js installato in locale (per testare il frontend).
- Python installato in locale (per testare il backend).

---

## 2. Project o Blueprint?

Su Render puoi organizzare i servizi in due modi:

| Opzione | Quando usarla | Per questo progetto |
|---------|---------------|---------------------|
| **Project** | È una cartella logica nella dashboard dove raggruppare più servizi (backend, frontend, database, ecc.). Si creano i servizi manualmente o tramite Blueprint. | ✅ **Consigliata per iniziare.** Crea un Project e dentro di esso aggiungi il backend come Web Service e il frontend come Static Site. |
| **Blueprint** | Legge un file `render.yaml` nel repository e crea/aggiorna automaticamente tutti i servizi descritti. | Utile solo dopo aver committato un file `render.yaml` nel repository. **Non usarla con un repository vuoto.** |

### Cosa fare nel tuo caso

Visto che hai già creato `github.com/mauriziocozzetto/netflix-clone-web` (vuoto), ti consiglio di:

1. Caricare il codice nel repository.
2. Su Render creare un **nuovo Project**, ad esempio chiamato `netflix-clone`.
3. All’interno del Project creare manualmente:
   - un **Web Service** per il backend (`backend/`);
   - uno **Static Site** per il frontend (`frontend/`).

Se in futuro vuoi automatizzare il deploy, potrai aggiungere un file `render.yaml` al repository e usare **New Blueprint** all’interno dello stesso Project.

---

## 3. Modifiche al codice necessarie

### 3.1 Backend — CORS

Attualmente il backend accetta richieste solo da `http://localhost:5173`. In produzione dobbiamo permettere anche l’origine del frontend su Render.

Apri `backend/app/main.py` e modifica il middleware CORS in modo che legga gli origini permesse da una variabile d’ambiente:

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ... altri import ...

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

In locale non cambierà nulla (`http://localhost:5173`).
In produzione imposterai `ALLOWED_ORIGINS` al dominio del frontend, ad esempio:

```
ALLOWED_ORIGINS=https://nome-frontend.onrender.com
```

Se vuoi permettere più domini, separali con la virgola.

### 3.2 Backend — variabili d’ambiente

Il backend usa `pydantic-settings` con un file `.env`. Su Render le imposteremo nel pannello del servizio, quindi il file `.env` non verrà caricato.

Le variabili da configurare sono:

| Variabile | Valore di esempio | Descrizione |
|-----------|-------------------|-------------|
| `DATABASE_URL` | `sqlite:///./netflix.db` | Percorso del database SQLite. |
| `SECRET_KEY` | una stringa lunga e casuale | Chiave per firmare i JWT. |
| `TMDB_API_KEY` | `daf81eb6bb254ac0fbc1698f53b401bf` | La tua API key di TMDB. |
| `ALLOWED_ORIGINS` | `https://nome-frontend.onrender.com` | Dominio del frontend. |

> **Importante:** cambia `SECRET_KEY` rispetto al valore di default `super-secret-key-change-in-production`.

### 3.3 Frontend — URL del backend

Attualmente `frontend/src/services/api.js` punta fisso a `http://localhost:8000`. Rendilo configurabile tramite variabile d’ambiente di Vite:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

In questo modo in locale continua a funzionare con `localhost:8000`, mentre su Render basterà impostare `VITE_API_BASE_URL` al dominio del backend.

### 3.4 Frontend — reindirizzamento SPA

Vite genera un’app a pagina singola (SPA). Se un utente ricarica una pagina come `/my-list`, Render Static Site deve servire sempre `index.html`.

Crea il file `frontend/public/_redirects` con questo contenuto:

```
/*    /index.html   200
```

---

## 4. Preparazione del repository Git

Se la cartella non è ancora un repository Git, inizializzalo e caricalo su GitHub/GitLab/Bitbucket:

```bash
cd /home/maurizio/Scrivania/netflix-clone
git init
git add .
git commit -m "Prepare app for Render deploy"
git branch -M main
git remote add origin <URL_DEL_TUO_REPO>
git push -u origin main
```

### Database nel repository

Per non perdere i dati attuali, il file `backend/netflix.db` deve essere incluso nel push. Verifica che non sia escluso da `.gitignore`. Se è presente in `.gitignore`, rimuovi la riga corrispondente:

```bash
git add backend/netflix.db
git commit -m "Include SQLite database with seed data"
git push
```

> Nota: Render, per i piani gratuiti, ha un filesystem **effimero**. Questo significa che i dati iniziali verranno preservati grazie al file nel repository, ma eventuali nuovi dati creati dagli utenti andranno persi al prossimo riavvio/redeploy del backend. Se invece vuoi una persistenza permanente, vedi la sezione [Persistenza con Render Disk](#persistenza-con-render-disk).

---

## 5. Deploy del backend

1. Dalla dashboard di Render, entra nel **Project** creato in precedenza (es. `netflix-clone`).
2. Clicca **New → Web Service**.
3. Collega il repository `netflix-clone-web`.
4. Compila i campi:

   | Campo | Valore |
   |-------|--------|
   | **Name** | `netflix-clone-api` (o nome a piacere) |
   | **Region** | quella più vicina ai tuoi utenti |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

5. Clicca **Advanced** e aggiungi le variabili d’ambiente:

   ```
   DATABASE_URL=sqlite:///./netflix.db
   SECRET_KEY=<genera_una_chiave_lunga_e_casuale>
   TMDB_API_KEY=daf81eb6bb254ac0fbc1698f53b401bf
   ALLOWED_ORIGINS=<lo imposterai dopo aver creato il frontend>
   ```

6. Clicca **Create Web Service**.
7. Attendi che il deploy finisca. Il backend sarà disponibile su un URL come:

   ```
   https://netflix-clone-api.onrender.com
   ```

8. Verifica che funzioni aprendo nel browser:

   ```
   https://netflix-clone-api.onrender.com/health
   ```

   Dovresti vedere:

   ```json
   {"status":"ok"}
   ```

---

## 6. Deploy del frontend

1. Sempre all’interno del **Project** `netflix-clone`, clicca **New → Static Site**.
2. Collega lo stesso repository `netflix-clone-web`.
4. Compila i campi:

   | Campo | Valore |
   |-------|--------|
   | **Name** | `netflix-clone-web` (o nome a piacere) |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

5. Aggiungi la variabile d’ambiente:

   ```
   VITE_API_BASE_URL=https://netflix-clone-api.onrender.com
   ```

   (usa l’URL reale del backend ottenuto al passo precedente).

6. Clicca **Create Static Site**.
7. Attendi la fine del deploy. Il frontend sarà disponibile su un URL come:

   ```
   https://netflix-clone-web.onrender.com
   ```

8. Torna nelle impostazioni del backend e aggiorna la variabile `ALLOWED_ORIGINS` con il dominio del frontend:

   ```
   ALLOWED_ORIGINS=https://netflix-clone-web.onrender.com
   ```

9. Render riavvierà automaticamente il backend con il nuovo CORS.

---

## 7. Gestione del database SQLite

### Piano gratuito: dati iniziali dal repository

Se usi il piano gratuito:

- Il file `backend/netflix.db` viene copiato dal repository al container.
- I dati iniziali sono quindi preservati al primo avvio.
- Qualsiasi modifica successiva (nuovi utenti, nuovi preferiti) persiste solo finché il container è attivo.
- Al prossimo deploy o dopo lo "spin-down" del piano gratuito, il database torna esattamente allo stato del file nel repository.

Questo approccio è sufficiente se accetti che i dati "nuovi" possano andare persi nel tempo.

### Persistenza con Render Disk

Se vuoi che anche le modifiche successive persistano (scritture nel database), devi usare un **Render Disk**, disponibile nei piani a pagamento.

1. Nel backend su Render, vai su **Disks** e clicca **Add Disk**.
2. Imposta:
   - **Name**: `sqlite-disk`
   - **Mount Path**: `/data`
   - **Size**: almeno 1 GB
3. Cambia la variabile d’ambiente del backend:

   ```
   DATABASE_URL=sqlite:////data/netflix.db
   ```

   (nota le quattro barre: `sqlite:////data/netflix.db`)

4. Per caricare i dati attuali sul disco la prima volta, puoi usare la **Render Shell** dal pannello del servizio:

   ```bash
   # Esempio: copia il DB dal repository al disco persistente
   cp /opt/render/project/src/backend/netflix.db /data/netflix.db
   ```

   Oppure, se preferisci che avvenga automaticamente, puoi usare uno start command condizionale:

   ```bash
   bash -c "[ ! -f /data/netflix.db ] && cp netflix.db /data/netflix.db; uvicorn app.main:app --host 0.0.0.0 --port $PORT"
   ```

   In questo modo, se il disco è vuoto, copia il database di partenza; altrimenti usa quello esistente.

---

## 8. Verifica finale

1. Apri l’URL del frontend, ad esempio `https://netflix-clone-web.onrender.com`.
2. Prova a:
   - registrarti / fare login;
   - navigare nella home;
   - aggiungere un film o una serie alla "My List";
   - ricaricare la pagina `/my-list` (deve funzionare grazie al file `_redirects`).
3. Controlla i log del backend nella dashboard di Render se qualcosa non funziona.

---

## 9. Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| Il frontend mostra errore di rete | CORS non configurato | Verifica `ALLOWED_ORIGINS` con il dominio esatto del frontend (protocollo `https://` incluso). |
| `404` sulle chiamate API | `VITE_API_BASE_URL` errato | Ricontrolla che punti al backend, senza `/` finale. |
| `404` al refresh di `/my-list` | Manca il redirect SPA | Verifica che `frontend/public/_redirects` esista e contenga `/* /index.html 200`. |
| I dati iniziali non ci sono | `netflix.db` non è nel repository | Committa e pusha `backend/netflix.db`, poi fai un redeploy. |
| I dati nuovi scompaiono | Piano gratuito + filesystem effimero | Normale nel piano gratuito. Usa Render Disk per persistenza permanente. |

---

## 10. Note sui costi e sulla persistenza

- **Piano gratuito Render:** backend, frontend e database funzionano senza costi. Il backend si "addormenta" dopo 15 minuti di inattività e impiega qualche secondo a risvegliarsi. Il filesystem è effimero.
- **Render Disk:** necessario per rendere persistenti le scritture su SQLite. Richiede un piano a pagamento per il Web Service.
- **Alternative a lungo termine:** se l’applicazione cresce, conviene sostituire SQLite con PostgreSQL (Render offre PostgreSQL managed, anch’esso a pagamento) per avere un database veramente persistente e condiviso tra più istanze.

---

**Buon deploy!** Se segui questi passi l’applicazione sarà online e i dati attuali di SQLite saranno visibili al primo avvio.
