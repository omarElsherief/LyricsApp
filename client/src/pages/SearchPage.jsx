import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { geniusFetch } from '../api';
import SongCard from '../components/SongCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [artistResults, setArtistResults] = useState([]);
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
      const songs = hits.map((h) => h.result);
      
      // Extract unique artists
      const artistsMap = new Map();
      songs.forEach(s => {
        if (s.primary_artist && !artistsMap.has(s.primary_artist.id)) {
          artistsMap.set(s.primary_artist.id, s.primary_artist);
        }
      });
      
      setArtistResults(Array.from(artistsMap.values()).slice(0, 3)); // Top 3 artists
      setResults(songs);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setArtistResults([]);
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

        {!loading && (results.length > 0 || artistResults.length > 0) && (
          <>
            {artistResults.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 className="results-heading">Artists</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                  {artistResults.map((artist, i) => (
                    <div 
                      key={artist.id}
                      className="album-card fade-in"
                      style={{ animationDelay: `${i * 40}ms`, cursor: 'pointer', textAlign: 'center' }}
                      onClick={() => navigate(`/artist/${artist.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/artist/${artist.id}`)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img 
                        src={artist.image_url} 
                        alt={artist.name} 
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px', boxShadow: 'var(--shadow-sm)' }} 
                      />
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{artist.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="results-heading">Songs</h2>
            <div className="results-list">
              {results.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
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
