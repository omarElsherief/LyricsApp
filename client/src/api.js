const API_BASE = 'http://127.0.0.1:3001';

// ─── Genius API proxy ─────────────────────────────────────────────────────────

/**
 * Proxy a Genius API request through the backend.
 * @param {string} path - Genius API path, e.g. "/search?q=..."
 */
export async function geniusFetch(path) {
  const res = await fetch(`${API_BASE}/api/genius?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Lyrics (lrclib.net) ──────────────────────────────────────────────────────

/**
 * Fetch lyrics from lrclib.net
 * @param {string} artist
 * @param {string} title
 */
export async function fetchLyrics(artist, title) {
  const res = await fetch(
    `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  );
  if (!res.ok) throw new Error('Lyrics not found');
  const data = await res.json();
  return data.plainLyrics;
}

// ─── Saved Songs (SQLite via backend) ────────────────────────────────────────

/**
 * Fetch all saved songs from the backend DB.
 * @returns {Promise<Array>}
 */
export async function getSavedSongs() {
  const res = await fetch(`${API_BASE}/api/saved`);
  if (!res.ok) throw new Error('Failed to load saved songs');
  return res.json();
}

/**
 * Save a song to the backend DB.
 * @param {{ id, title, artist, albumArt, lyrics }} song
 */
export async function saveSong({ id, title, artist, albumArt, lyrics }) {
  const res = await fetch(`${API_BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, artist, albumArt, lyrics }),
  });
  if (!res.ok) throw new Error('Failed to save song');
  return res.json();
}

/**
 * Remove a song from the backend DB.
 * @param {string|number} id
 */
export async function deleteSavedSong(id) {
  const res = await fetch(`${API_BASE}/api/saved/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete saved song');
  return res.json();
}

/**
 * Check if a song is saved in the backend DB.
 * @param {string|number} id
 * @returns {Promise<{ saved: boolean, songData: object|null }>}
 */
export async function checkSavedSong(id) {
  const all = await getSavedSongs();
  const found = all.find(s => String(s.id) === String(id));
  return { saved: !!found, songData: found || null };
}
