# Netflix Clone

Clone di Netflix con backend FastAPI + SQLModel + SQLite e frontend React + Vite + TailwindCSS.

---

## Guida all'installazione e avvio

### Prerequisiti
- Python 3.10+
- Node.js 18+ e npm
- Una API Key di TMDB (ottienila su https://www.themoviedb.org/settings/api)

### 1. Configurare le variabili d'ambiente
Crea il file `backend/.env` con il seguente contenuto:

```env
TMDB_API_KEY=la_tua_chiave_tmdb
```

> Il file `backend/.env` è già presente nel progetto: aggiorna solo il valore di `TMDB_API_KEY`.

### 2. Avviare il backend
Dal terminale, nella root del progetto:

```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Il backend sarà disponibile su http://localhost:8000.

### 3. Avviare il frontend
In un altro terminale, sempre dalla root del progetto:

```bash
cd frontend
npm install
npm run dev
```

Il frontend sarà disponibile su http://localhost:5173.

### 4. Utilizzo
- Apri il browser all'indirizzo http://localhost:5173.
- Registra un nuovo account o accedi con uno esistente.
- Naviga tra Home, Serie TV, Film, La mia Lista e guarda i trailer dei titoli.

### Comandi utili
- **Build produzione frontend:** `cd frontend && npm run build`
- **Preview produzione frontend:** `cd frontend && npm run preview`
- **Test health backend:** `curl http://localhost:8000/health`

---

## Rotte del backend

Il backend espone le API all'indirizzo `http://localhost:8000`.
Di seguito l'elenco delle rotte disponibili con metodo, parametri ed esempi di utilizzo via `curl`.

### Health check

Verifica che il server sia attivo.

```http
GET /health
```

**Esempio:**

```bash
curl -s http://localhost:8000/health
```

**Risposta:**

```json
{"status": "ok"}
```

---

### Autenticazione

Le rotte di autenticazione utilizzano cookie `HttpOnly` per gestire la sessione.

#### Registrazione

Crea un nuovo account.

```http
POST /api/v1/auth/register
```

**Body JSON:**

| Campo       | Tipo   | Obbligatorio | Descrizione              |
|-------------|--------|--------------|--------------------------|
| `email`     | string | Sì           | Email dell'utente        |
| `password`  | string | Sì           | Password                 |
| `first_name`| string | No           | Nome dell'utente         |
| `last_name` | string | No           | Cognome dell'utente      |

**Esempio:**

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "mario.rossi@example.com", "password": "secret123", "first_name": "Mario", "last_name": "Rossi"}'
```

**Risposta:**

```json
{"email": "mario.rossi@example.com", "first_name": "Mario", "last_name": "Rossi", "id": 1, "created_at": "2026-09-06T21:16:31.736878"}
```

---

#### Login

Effettua il login e imposta il cookie di sessione.

```http
POST /api/v1/auth/login
```

**Body JSON:**

| Campo      | Tipo   | Obbligatorio | Descrizione       |
|------------|--------|--------------|-------------------|
| `email`    | string | Sì           | Email             |
| `password` | string | Sì           | Password          |

**Esempio:**

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mario.rossi@example.com", "password": "secret123"}' \
  -c cookies.txt
```

**Risposta:**

```json
{"message": "Login successful"}
```

Il cookie viene salvato nel file `cookies.txt`.

---

#### Utente corrente

Restituisce i dati dell'utente autenticato.

```http
GET /api/v1/auth/me
```

**Esempio:**

```bash
curl -s http://localhost:8000/api/v1/auth/me -b cookies.txt
```

**Risposta:**

```json
{"email": "mario.rossi@example.com", "first_name": "Mario", "last_name": "Rossi", "id": 1, "created_at": "2026-09-06T21:16:31.736878"}
```

---

#### Logout

Elimina il cookie di sessione.

```http
POST /api/v1/auth/logout
```

**Esempio:**

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/logout -b cookies.txt -c cookies.txt
```

**Risposta:**

```json
{"message": "Logout successful"}
```

---

### Media TMDB

Le rotte media agiscono da proxy verso le API di TMDB.

#### Trending

Restituisce i titoli di tendenza.

```http
GET /api/v1/media/trending
```

**Query string (opzionale):**

| Parametro    | Tipo   | Valori ammessi     | Default | Descrizione                       |
|--------------|--------|--------------------|---------|-----------------------------------|
| `media_type` | string | `all`, `movie`, `tv` | `all`   | Tipo di contenuto da recuperare   |

**Esempi:**

```bash
# Tutti i trending
curl -s "http://localhost:8000/api/v1/media/trending"

# Solo film trending
curl -s "http://localhost:8000/api/v1/media/trending?media_type=movie"

# Solo serie TV trending
curl -s "http://localhost:8000/api/v1/media/trending?media_type=tv"
```

---

#### Popolari

Restituisce i contenuti popolari per tipo.

```http
GET /api/v1/media/popular/{media_type}
```

**Parametro path:**

| Parametro    | Tipo   | Valori ammessi | Descrizione          |
|--------------|--------|----------------|----------------------|
| `media_type` | string | `movie`, `tv`  | Tipo di contenuto    |

**Esempi:**

```bash
# Film popolari
curl -s "http://localhost:8000/api/v1/media/popular/movie"

# Serie TV popolari
curl -s "http://localhost:8000/api/v1/media/popular/tv"
```

---

#### Categoria

Restituisce i contenuti per una categoria/genere.

```http
GET /api/v1/media/category/{category_name}
```

**Parametro path:**

| Parametro       | Tipo   | Esempi                                    | Descrizione              |
|-----------------|--------|-------------------------------------------|--------------------------|
| `category_name` | string | `action`, `comedy`, `horror`, `documentary` | Nome della categoria     |

**Query string (opzionale):**

| Parametro    | Tipo   | Valori ammessi | Default  | Descrizione       |
|--------------|--------|----------------|----------|-------------------|
| `media_type` | string | `movie`, `tv`  | `movie`  | Tipo di contenuto |

**Esempi:**

```bash
# Film d'azione
curl -s "http://localhost:8000/api/v1/media/category/action?media_type=movie"

# Serie TV horror
curl -s "http://localhost:8000/api/v1/media/category/horror?media_type=tv"
```

---

#### Ricerca

Cerca film e serie TV per parola chiave.

```http
GET /api/v1/media/search
```

**Query string:**

| Parametro | Tipo   | Obbligatorio | Descrizione          |
|-----------|--------|--------------|----------------------|
| `q`       | string | Sì           | Parola chiave        |
| `page`    | int    | No           | Numero di pagina     |

**Esempio:**

```bash
curl -s "http://localhost:8000/api/v1/media/search?q=inception"
```

---

#### Dettaglio titolo

Restituisce i dettagli di un film o una serie TV.

```http
GET /api/v1/media/{media_type}/{media_id}
```

**Parametri path:**

| Parametro    | Tipo   | Valori ammessi | Descrizione              |
|--------------|--------|----------------|--------------------------|
| `media_type` | string | `movie`, `tv`  | Tipo di contenuto        |
| `media_id`   | int    | ID TMDB        | Identificativo del titolo|

**Esempi:**

```bash
# Dettagli del film Inception (ID 27205)
curl -s "http://localhost:8000/api/v1/media/movie/27205"

# Dettagli della serie TV Breaking Bad (ID 1396)
curl -s "http://localhost:8000/api/v1/media/tv/1396"
```

---

#### Trailer

Restituisce la chiave YouTube del trailer più pertinente.

```http
GET /api/v1/media/{media_type}/{media_id}/trailer
```

**Parametri path:**

| Parametro    | Tipo   | Valori ammessi | Descrizione              |
|--------------|--------|----------------|--------------------------|
| `media_type` | string | `movie`, `tv`  | Tipo di contenuto        |
| `media_id`   | int    | ID TMDB        | Identificativo del titolo|

**Query string (opzionale):**

| Parametro           | Tipo   | Descrizione                              |
|---------------------|--------|------------------------------------------|
| `title`             | string | Titolo del film/serie per migliorare la scelta del trailer |
| `original_language` | string | Lingua originale del contenuto (es. `en`, `it`) |

**Esempi:**

```bash
# Trailer di Inception
curl -s "http://localhost:8000/api/v1/media/movie/27205/trailer"

# Trailer di Pinocchio: Unstrung con parametri di contesto
curl -s "http://localhost:8000/api/v1/media/movie/1232569/trailer?title=Pinocchio%3A%20Unstrung&original_language=en"
```

**Risposta:**

```json
{"key": "Y4lZewE6JMI"}
```

---

### Preferiti

Le rotte preferiti richiedono autenticazione.

#### Lista preferiti

```http
GET /api/v1/favorites
```

**Esempio:**

```bash
curl -s http://localhost:8000/api/v1/favorites -b cookies.txt
```

---

#### Aggiungi preferito

```http
POST /api/v1/favorites
```

**Body JSON:**

| Campo         | Tipo   | Obbligatorio | Descrizione              |
|---------------|--------|--------------|--------------------------|
| `media_id`    | int    | Sì           | ID TMDB del contenuto    |
| `media_type`  | string | Sì           | `movie` o `tv`           |
| `title`       | string | Sì           | Titolo del contenuto     |
| `poster_path` | string | No           | Percorso del poster TMDB |

**Esempio:**

```bash
curl -s -X POST http://localhost:8000/api/v1/favorites \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"media_id": 27205, "media_type": "movie", "title": "Inception", "poster_path": "/inception.jpg"}'
```

---

#### Rimuovi preferito

```http
DELETE /api/v1/favorites/{media_id}
```

**Parametro path:**

| Parametro  | Tipo | Descrizione           |
|------------|------|-----------------------|
| `media_id` | int  | ID TMDB del contenuto |

**Esempio:**

```bash
curl -s -X DELETE http://localhost:8000/api/v1/favorites/27205 -b cookies.txt
```


