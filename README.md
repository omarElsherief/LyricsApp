# Lyriq: Modern Lyrics & Music Explorer

A minimalist, high-performance web application for searching and exploring song lyrics, artists, and albums. Built with a modern React frontend and an Express backend proxy, it features a sleek dark mode design with a signature sage green accent and focuses heavily on performance and instant load times.

## 🚀 Features

- **Global Search:** Search for any song or artist. Artists are intelligently extracted and grouped from song hits.
- **Read Lyrics:** High-quality, accurately synced and plain lyrics provided by the open-source `lrclib.net` database.
- **Artist Profiles:** View an artist's biography, top songs, and top albums seamlessly.
- **Album Explorer:** Dive into specific albums, view their high-res covers, release years, and full tracklists.
- **Save Favorites (Instant Load):** Bookmark your favorite songs. Saved songs and their lyrics are stored in a backend SQLite database, enabling **instant, 0-latency loading** when you reopen them—completely bypassing external APIs.
- **Dynamic Routing & State Passing:** Navigating between pages passes state forward, allowing the app to fetch lyrics and metadata in parallel for blazing-fast load times.
- **Premium Aesthetics:** Dark mode by default, glassmorphism navbars, smooth micro-animations on hover, and highly legible typography (`Georgia` for lyrics reading).

## 🛠 Tech Stack

### Frontend
- **React 19** & **Vite**
- **React Router DOM v7** for dynamic client-side routing
- **Vanilla CSS** (`index.css`) utilizing modern CSS variables and animations

### Backend
- **Node.js** & **Express** proxy server
- **better-sqlite3** for synchronous, lightning-fast database operations

### External APIs
- **Genius API:** Used for fetching rich metadata (song details, artist bios, album artwork).
- **Lrclib.net:** Used for fetching actual song lyrics (as Genius does not provide raw lyrics via their API).

## 📂 Folder Structure

```text
lyrics-app/
├── client/                     # React Frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Main router setup
│       ├── main.jsx            # React entry point
│       ├── api.js              # Unified fetch utilities (geniusFetch, checkSavedSong, etc.)
│       ├── index.css           # Global design tokens and styles
│       ├── components/
│       │   └── SongCard.jsx    # Reusable song card with inline save button
│       └── pages/
│           ├── SearchPage.jsx      # Homepage / Search
│           ├── SongPage.jsx        # Single song view & lyrics reader
│           ├── ArtistPage.jsx      # Artist profile, top songs, top albums
│           ├── AlbumPage.jsx       # Album details and tracklist
│           └── SavedSongsPage.jsx  # User's bookmarked library
│
└── server/                     # Express Backend
    ├── package.json
    ├── index.js                # Server entry point, API proxy, and SQLite logic
    └── lyrics.db               # Auto-generated SQLite database
```

## 🏗 API Architecture

1. **The Genius Proxy (`/api/genius`):** The Genius API requires an access token and often blocks direct browser requests (CORS). The Express server at `server/index.js` acts as a proxy, securely attaching the `GENIUS_API_KEY` and forwarding requests from the React client.
2. **Lrclib Fetching:** Lyrics are fetched client-side directly from `https://lrclib.net/api/get` using the artist name and track title.
3. **Saved Songs DB (`/api/saved`):** When a user clicks "Save" on a `<SongCard />` or `SongPage.jsx`, the client fetches the lyrics and sends the complete payload to the backend, which upserts it into `lyrics.db`. When that song is clicked again, `SongPage.jsx` checks the DB first and renders instantly without hitting Genius or Lrclib.

## 🏁 Getting Started

### 1. Clone & Setup Backend
```bash
cd lyrics-app/server
npm install
```
Create a `.env` file in the `server/` directory and add your Genius API key:
```env
GENIUS_API_KEY=your_genius_access_token_here
PORT=3001
```
Start the backend:
```bash
npm run dev
```

### 2. Setup Frontend
Open a new terminal window:
```bash
cd lyrics-app/client
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## ⚠️ Known Issues / Limitations

- **Genius API Workarounds:** The public Genius API does not have a dedicated `/search/artists` endpoint or a public `/artists/:id/albums` endpoint. To solve this, `SearchPage.jsx` dynamically extracts unique artists from song search hits, and `ArtistPage.jsx` extracts albums by iterating through an artist's top songs. 
- **Lyrics Coverage:** The app relies on `lrclib.net` for lyrics. If a song is highly obscure, unreleased, or very new, lyrics might not be available.
- **Strict Mode Race Conditions:** Handled elegantly via cleanup functions, but React 19's Strict Mode previously caused issues with parallel fetches for albums in development mode.

## 📝 Changelog

- **v1.0.0 (Initial):** Setup React/Vite and Express proxy.
- **v1.1.0:** Implemented core search and song pages.
- **v1.2.0:** Migrated lyrics fetching logic from `lyrics.ovh` to the more reliable `lrclib.net`.
- **v1.3.0:** Added Artist Profiles and Album explorers.
- **v1.4.0 (Performance & DB):** Replaced `localStorage` with a robust `better-sqlite3` backend. Implemented parallel network fetching and React Router state passing to eliminate sequential loading waterfalls.
- **v1.4.1 (UX Polish):** Added inline save functionality directly to `SongCard.jsx`, allowing users to bookmark directly from search results. Extracted artists into global search. Updated lyrics typography for maximum readability.
