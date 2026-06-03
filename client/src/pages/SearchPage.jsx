import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { geniusFetch } from '../api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Focus search on '/' key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await geniusFetch(`/search?q=${encodeURIComponent(q)}`);
      const hits = data.response?.hits || [];
      setResults(hits.map((h) => h.result));
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    search(query);
  };

  return (
    <div id="search-page">
      {/* Hero */}
      <section className="search-section">
        <h1 className="search-hero-title fade-in">
          Discover <span>Lyrics</span>
        </h1>
        <p className="search-hero-sub fade-in fade-in-delay-1">
          Search for any song or artist to find full lyrics
        </p>

        <form onSubmit={handleSubmit} className="search-bar-wrapper fade-in fade-in-delay-2">
          <span className="search-bar-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            id="search-input"
            className="search-bar"
            type="text"
            placeholder="Search songs or artists…"
            value={query}
            onChange={handleInput}
            autoComplete="off"
          />
          <span className="search-shortcut">/</span>
        </form>
      </section>

      {/* Results */}
      <section className="results-section" id="search-results">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Searching…</span>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <h2 className="results-heading">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </h2>
            <div className="results-list">
              {results.map((song, i) => (
                <div
                  key={song.id}
                  className={`song-card fade-in`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/song/${song.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/song/${song.id}`)}
                  id={`song-result-${song.id}`}
                >
                  <img
                    className="song-card-art"
                    src={song.song_art_image_thumbnail_url}
                    alt=""
                    loading="lazy"
                  />
                  <div className="song-card-info">
                    <div className="song-card-title">{song.title}</div>
                    <div className="song-card-artist">{song.primary_artist?.name}</div>
                  </div>
                  <span className="song-card-arrow" aria-hidden="true">→</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">¯\_(ツ)_/¯</div>
            <p className="empty-state-text">
              No results found. Try a different search term.
            </p>
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="empty-state">
            <div className="empty-state-icon">♫</div>
            <p className="empty-state-text">
              Type a song name or artist above to get started
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
