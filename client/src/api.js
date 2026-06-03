const API_BASE = 'http://127.0.0.1:3001';

/**
 * Proxy a Genius API request through the backend.
 * @param {string} path - Genius API path, e.g. "/search?q=..."
 */
export async function geniusFetch(path) {
  const res = await fetch(`${API_BASE}/api/genius?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch lyrics from lyrics.ovh
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
