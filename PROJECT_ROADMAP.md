# OpenCode Execution Plan & Technical Spec: Netflix Clone

> **Istruzioni Operative per l'Agente OpenCode:**
> 1. Leggi attentamente questo file all'inizio di ogni esecuzione o iterazione del `/loop`.
> 2. Individua il primo task non completato nella checklist (`- [ ]`).
> 3. Implementa il codice necessario garantendo la conformità con lo stack tecnologico stabilito.
> 4. Esegui i test/verifiche per confermare che il codice funzioni senza errori.
> 5. Modifica questo file aggiornando la casella da `- [ ]` a `- [x]` solo quando la funzionalità è completata.
> 6. Non modificare l'architettura concordata né saltare passaggi senza aver completato i prerequisiti.

---

## 1. Architettura Tecnologica & Design System

### Backend (FastAPI + SQLModel + SQLite)
- **Framework:** FastAPI (Python 3.10+)
- **Database / ORM:** SQLite gestito tramite SQLModel (Pydantic + SQLAlchemy)
- **Autenticazione:** OAuth2 / JWT tramite Cookie `HttpOnly`, `SameSite=Lax` (inaccessibili dal JavaScript lato client)
- **API External Client:** `httpx` integrato per comunicare in modo asincrono con **TMDB (The Movie Database) API**, è l'equivalente di requests sincrono.
- **Struttura Pacchetti:**
  - `backend/app/main.py`: Entrypoint dell'applicazione
  - `backend/app/core/`: Configurazione (`config.py`), Sicurezza/JWT (`security.py`), DB (`database.py`)
  - `backend/app/models/`: Definizione schemi DB (`user.py`, `favorite.py`)
  - `backend/app/api/`: Endpoint suddivisi per ambito (`auth.py`, `tmdb.py`, `favorites.py`)
  - `backend/app/services/`: Integrazione client TMDB (`tmdb_client.py`)

### Frontend (React + Vite + TailwindCSS)
- **Framework / Bundler:** React 18+ via Vite
- **Styling:** TailwindCSS con palette colore custom (Netflix Dark: `#141414`, Red Accent: `#E50914`, Grey Neutral: `#181818`, `#2F2F2F`)
- **Routing:** React Router v6
- **Media Player:** Integration iframe YouTube per la riproduzione trailer TMDB
- **Struttura Pacchetti:**
  - `frontend/src/components/`: Layout (`Navbar`), UI (`HeroBanner`, `MovieRow`, `MovieCard`, `MovieModal`, `ProtectedRoute`, `SkeletonBanner`, `SkeletonRow`)
  - `frontend/src/context/`: AuthContext (`AuthContext.jsx`)
  - `frontend/src/pages/`: `Home.jsx`, `Login.jsx`, `MyList.jsx`, `Watch.jsx`
  - `frontend/src/services/`: Client Fetch configurato con `credentials: 'include'`

---

## 2. Checklist dei Micro-Task di Sviluppo

### Fase 1: Setup dell'Ambiente e Struttura Progetto
- [x] **Task 1.1:** Creare la struttura directory principale (`/backend` e `/frontend`).
- [x] **Task 1.2:** Configurare il backend FastAPI:
  - Inizializzare il file `requirements.txt` (`fastapi`, `uvicorn`, `sqlmodel`, `httpx`, `pyjwt`, `passlib[bcrypt]`, `python-multipart`).
  - Creare `backend/app/main.py` con istanza FastAPI e configurazione **CORS** (`allow_origins=["http://localhost:5173"]`, `allow_credentials=True`).
- [x] **Task 1.3:** Configurare il frontend React con Vite e TailwindCSS:
  - Creare progetto Vite in `/frontend`.
  - Installare `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`, `lucide-react`.
  - Configurare `tailwind.config.js` estendendo i colori del tema Netflix (`netflix-red: #E50914`, `netflix-black: #141414`).

---

### Fase 2: Backend - Database, Modelli e Autenticazione (Cookie HttpOnly)
- [x] **Task 2.1:** Configurare il Database in `backend/app/core/database.py`:
  - Definire la connessione SQLite (`sqlite:///./netflix.db`) ed engine SQLModel.
  - Creare la funzione `init_db()` per generare le tabelle.
- [x] **Task 2.2:** Creare i modelli SQLModel:
  - `User`: `id` (int, PK), `email` (str, unique, index), `first_name` (str), `last_name` (str), `hashed_password` (str), `created_at` (datetime).
  - `Favorite`: `id` (int, PK), `user_id` (int, FK User), `media_id` (int), `media_type` (str: "movie"/"tv"), `title` (str), `poster_path` (str).
- [x] **Task 2.3:** Implementare le utility di Sicurezza (`backend/app/core/security.py`):
  - Funzioni per hashing/verifica password con `passlib` (bcrypt).
  - Funzioni per la generazione e decodifica di token JWT (funzione `create_access_token`).
- [x] **Task 2.4:** Implementare gli Endpoint di Autenticazione (`backend/app/api/auth.py`):
  - `POST /api/v1/auth/register`: Registrazione utente con nome, cognome, email e password; controllo duplicati email; salvataggio password hash.
  - `POST /api/v1/auth/login`: Verifica credenziali. In caso positivo, imposta il token JWT nel cookie `access_token` con attributi: `httponly=True`, `samesite="lax"`, `secure=False` (True in prod).
  - `POST /api/v1/auth/logout`: Elimina il cookie `access_token` impostando la scadenza immediata.
  - `GET /api/v1/auth/me`: Verifica la validità del cookie JWT ed estrae le informazioni dell'utente corrente.

---

### Fase 3: Backend - Proxy Service per TMDB API
- [x] **Task 3.1:** Creare il client TMDB in `backend/app/services/tmdb_client.py`:
  - Configurare la gestione delle chiamate ad `https://api.themoviedb.org/3` leggendo la chiave API dalle variabili d'ambiente (`TMDB_API_KEY`).
  - Creare funzioni per recuperare:
    - Trending (Film e Serie TV del momento)
    - Titoli per Categoria (Azione, Commedia, Horror, Documentari, ecc.)
    - Dettagli Titolo e Trailer Video (endpoint `/movie/{id}/videos` o `/tv/{id}/videos`)
    - Ricerca per parola chiave (`/search/multi`)
- [x] **Task 3.2:** Creare gli endpoint Proxy FastAPI (`backend/app/api/tmdb.py`):
  - `GET /api/v1/media/trending`: Restituisce la lista media del momento.
  - `GET /api/v1/media/popular/{media_type}`: Restituisce i media popolari per tipo (`movie` o `tv`).
  - `GET /api/v1/media/category/{category_name}`: Restituisce i media per categoria specifica.
  - `GET /api/v1/media/{type}/{id}/trailer`: Restituisce il link/key del video YouTube del trailer.
  - `GET /api/v1/media/search?q={query}`: Proxy per la ricerca contenuti.
- [x] **Task 3.3:** Creare gli endpoint Preferiti (`backend/app/api/favorites.py`):
  - `POST /api/v1/favorites`: Aggiunge un media alla lista preferiti dell'utente autenticato.
  - `DELETE /api/v1/favorites/{media_id}`: Rimuove un media dai preferiti.
  - `GET /api/v1/favorites`: Restituisce tutti i preferiti dell'utente.

---

### Fase 4: Frontend - Gestione Stato, AuthContext e Routing
- [x] **Task 4.1:** Creare `AuthContext.jsx` in `frontend/src/context/`:
  - Gestire lo stato di caricamento e lo stato `user`.
  - All'avvio dell'app, invocare `GET /api/v1/auth/me` con `credentials: 'include'`.
  - Fornire le funzioni `login`, `register`, `logout`.
- [x] **Task 4.2:** Configurare `React Router` in `frontend/src/App.jsx`:
  - Creare un componente `ProtectedRoute` per reindirizzare a `/login` gli utenti non autenticati.
  - Configurare le rotte: `/login`, `/`, `/my-list`, `/watch/:type/:id`.

---

### Fase 5: Frontend - Componenti UI/UX Identici a Netflix
- [x] **Task 5.1:** Navbar Netflix Component (`frontend/src/components/Navbar.jsx`):
  - Logo Netflix in rosso a sinistra.
  - Link di navigazione (Home, Serie TV, Film, La mia Lista).
  - Effetto transizione background da trasparente a nero opaco in base allo scroll verticale (`window.scrollY > 50`).
  - Menu profilo utente a destra con opzione Logout.
- [x] **Task 5.2:** Hero Banner Component (`frontend/src/components/HeroBanner.jsx`):
  - Mostrare un titolo in evidenza casuale recuperato dai trending.
  - Includere immagine di sfondo ad alta risoluzione con gradiente sfumato verso il basso (`bg-gradient-to-t`).
  - Titolo, descrizione limitata nel testo, bottoni "Riproduci" e "Altre Info".
- [x] **Task 5.3:** Movie Row & Card Component (`frontend/src/components/MovieRow.jsx`, `MovieCard.jsx`):
  - Layout a carosello con scroll orizzontale privo di scrollbar visibile.
  - Effetto hover sulle card: leggero ingrandimento (`scale-105`), effetto ombreggiatura.
  - Icone rapida azione: "Play", "Aggiungi alla Mia Lista", "Info".
- [x] **Task 5.4:** Modal Dettaglio Titolo (`frontend/src/components/MovieModal.jsx`):
  - Pop-up stile Netflix al passaggio del mouse su una card (con ritardo di 1 secondo).
  - Riproduzione automatica o in evidenza del trailer YouTube tramite iframe.
  - Visualizzazione genere, rating, data di uscita e overview.
- [x] **Task 5.5:** Pagina Login / Registrazione (`frontend/src/pages/Login.jsx`):
  - Sfondo scuro con il classico backdrop sfocato delle locandine Netflix.
  - Form stilizzato con input rettangolari grigi, testo bianco, bottone rosso acceso.
  - Toggle rapido tra Login e Registrazione.
  - In registrazione: campi Nome, Cognome, Email, Password, Conferma Password con icona occhio.
  - Validazione che le password coincidano prima di inviare la richiesta.
- [x] **Task 5.6:** Pagina "La Mia Lista" (`frontend/src/pages/MyList.jsx`):
  - Griglia responsive per mostrare i titoli salvati nel DB SQLite dell'utente.

---

### Fase 6: Polish, Testing Finale e Refactoring
- [x] **Task 6.1:** Gestione Errori e Stati di Loading:
  - Aggiungere componenti Skeleton Loader grigi per le righe dei film durante il recupero API.
  - Gestire notifiche d'errore visive nel Form di Login/Registrazione.
- [x] **Task 6.2:** Verificare la sicurezza dei Cookie:
  - Assicurarsi che le chiamate JavaScript non facciano mai affidamento su token salvati in `localStorage` o `sessionStorage`.
  - Verificare che tutte le richieste autenticate verso FastAPI includano la proprietà `credentials: 'include'`.
- [x] **Task 6.3:** Test completo dell'intero flusso dell'applicazione:
  - Registrazione nuovo utente -> Login -> Navigazione Home -> Riproduzione Trailer -> Aggiunta a "La mia lista" -> Logout.
- [x] **Task 6.4:** Scrolling circolare nei `MovieRow`:
  - La freccia sinistra all'inizio della riga salta alla fine; la freccia destra alla fine torna all'inizio.
- [x] **Task 6.5:** Ottimizzazione visualizzazione card e modale:
  - Overlay hover sulle card a gradiente (non scurisce tutta l'immagine).
  - Modale dettaglio ridotto per apparire interamente al centro dello schermo.
  - Apertura modale al passaggio del mouse con ritardo configurato.
- [x] **Task 6.6:** Messaggio per ricerche senza risultati:
  - Se una ricerca non restituisce titoli, mostrare il messaggio "Nessun risultato trovato per ...".
- [x] **Task 6.7:** Selezione trailer affidabile:
  - Richiedere video trailer sia in italiano che in inglese e scegliere quello più pertinente al titolo e alla lingua originale.


