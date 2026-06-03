# Lyriq — Lyrics Finder

A minimal, elegant lyrics search app built with React + Vite and an Express proxy backend.

![Dark mode UI with sage green accents]

## Features

- **Search** — Find songs and artists via the Genius API
- **Song Page** — Album art, song title, artist name, and full lyrics
- **Artist Page** — Artist image, name, and a list of their popular songs
- **Dark Mode** — Sleek dark UI with sage green (#A8B5A2) accent

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React + Vite                              |
| Backend  | Express (API proxy)                       |
| Search   | [Genius API](https://genius.com/developers) |
| Lyrics   | [lrclib.net](https://lrclib.net)          |

## Getting Started

### 1. Clone & install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure your Genius API key

```bash
cd server
cp .env.example .env
```

Open `server/.env` and replace `your_key_here` with your [Genius API token](https://genius.com/api-clients).

```env
GENIUS_API_KEY=your_actual_key
```

### 3. Run

Open **two terminals**:

```bash
# Terminal 1 — Start the backend proxy
cd server
npm run dev
# → runs on http://localhost:3001

# Terminal 2 — Start the frontend
cd client
npm run dev
# → runs on http://localhost:5173
```

## Folder Structure

```
lyrics-app/
├── client/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/    # SearchPage, SongPage, ArtistPage
│   │   ├── api.js    # API helper functions
│   │   ├── App.jsx   # Root component + routing
│   │   ├── main.jsx  # Entry point
│   │   └── index.css # Design system
│   ├── index.html
│   └── vite.config.js
├── server/           # Express proxy
│   ├── index.js      # Single /api/genius endpoint
│   ├── .env          # Your API key (gitignored)
│   └── .env.example  # Template
└── README.md
```

## API Architecture

```
Frontend (React)
  ├── Search/Song/Artist data → GET /api/genius?path=...  → Express → Genius API
  └── Lyrics                  → GET lrclib.net/api/get?artist_name={artist}&track_name={title} (direct, no key needed)
```

The Express server exists solely to keep your Genius API key secret. It proxies requests to `https://api.genius.com` with the `Authorization` header injected server-side.

## License

MIT
