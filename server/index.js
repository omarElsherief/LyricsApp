import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

// ─── SQLite setup ────────────────────────────────────────────────────────────
const db = new Database(join(__dirname, 'lyrics.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_songs (
    id       TEXT PRIMARY KEY,
    title    TEXT,
    artist   TEXT,
    album_art TEXT,
    lyrics   TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS custom_lyrics (
    song_id  TEXT PRIMARY KEY,
    title    TEXT,
    artist   TEXT,
    lyrics   TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Saved Songs endpoints ────────────────────────────────────────────────────

// GET /api/saved — list all saved songs (newest first)
app.get('/api/saved', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, title, artist, album_art, lyrics, saved_at FROM saved_songs ORDER BY saved_at DESC'
    ).all();
    res.json(rows);
  } catch (err) {
    console.error('GET /api/saved error:', err.message);
    res.status(500).json({ error: 'Failed to load saved songs' });
  }
});

// POST /api/saved — upsert a saved song { id, title, artist, albumArt, lyrics }
app.post('/api/saved', (req, res) => {
  const { id, title, artist, albumArt, lyrics } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    db.prepare(`
      INSERT INTO saved_songs (id, title, artist, album_art, lyrics)
      VALUES (@id, @title, @artist, @albumArt, @lyrics)
      ON CONFLICT(id) DO UPDATE SET
        title     = excluded.title,
        artist    = excluded.artist,
        album_art = excluded.album_art,
        lyrics    = excluded.lyrics
    `).run({ id: String(id), title, artist, albumArt: albumArt || null, lyrics: lyrics || null });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/saved error:', err.message);
    res.status(500).json({ error: 'Failed to save song' });
  }
});

// DELETE /api/saved/:id — remove a saved song
app.delete('/api/saved/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM saved_songs WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/saved error:', err.message);
    res.status(500).json({ error: 'Failed to delete saved song' });
  }
});

// ─── Custom Lyrics endpoints ──────────────────────────────────────────────────

// GET /api/lyrics/:songId — return custom lyrics if exists
app.get('/api/lyrics/:songId', (req, res) => {
  try {
    const row = db.prepare('SELECT lyrics FROM custom_lyrics WHERE song_id = ?').get(req.params.songId);
    if (row) {
      res.json({ lyrics: row.lyrics });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('GET /api/lyrics error:', err.message);
    res.status(500).json({ error: 'Failed to get custom lyrics' });
  }
});

// POST /api/lyrics — save custom lyrics
app.post('/api/lyrics', (req, res) => {
  const { songId, title, artist, lyrics } = req.body;
  if (!songId || !lyrics) return res.status(400).json({ error: 'Missing songId or lyrics' });

  try {
    db.prepare(`
      INSERT INTO custom_lyrics (song_id, title, artist, lyrics)
      VALUES (@songId, @title, @artist, @lyrics)
      ON CONFLICT(song_id) DO UPDATE SET
        title  = excluded.title,
        artist = excluded.artist,
        lyrics = excluded.lyrics
    `).run({ songId: String(songId), title, artist, lyrics });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/lyrics error:', err.message);
    res.status(500).json({ error: 'Failed to save custom lyrics' });
  }
});

// ─── Genius API proxy ─────────────────────────────────────────────────────────
app.get('/api/genius', async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  if (!GENIUS_API_KEY) {
    return res.status(500).json({ error: 'GENIUS_API_KEY is not configured' });
  }

  try {
    const url = `https://api.genius.com${path}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${GENIUS_API_KEY}` },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Genius API proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Genius API' });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite DB: ${join(__dirname, 'lyrics.db')}`);
});
