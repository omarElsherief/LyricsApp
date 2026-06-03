import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SavedSongsPage() {
  const navigate = useNavigate();
  const [savedSongs, setSavedSongs] = useState([]);

  useEffect(() => {
    const loadSaved = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('lyriq_saved_songs')) || [];
        setSavedSongs(saved);
      } catch (err) {
        console.error('Failed to load saved songs:', err);
      }
    };
    loadSaved();
    
    // Optional: listen for storage events if we want multi-tab sync
    window.addEventListener('storage', loadSaved);
    return () => window.removeEventListener('storage', loadSaved);
  }, []);

  const removeSong = (e, id) => {
    e.stopPropagation();
    const updated = savedSongs.filter(s => s.id !== id);
    setSavedSongs(updated);
    localStorage.setItem('lyriq_saved_songs', JSON.stringify(updated));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div id="saved-songs-page">
      <section className="results-section fade-in" style={{ paddingTop: '40px' }}>
        <h1 className="search-hero-title" style={{ fontSize: '2.2rem', marginBottom: '32px' }}>
          Saved <span>Songs</span>
        </h1>

        {savedSongs.length > 0 ? (
          <div className="results-list">
            {savedSongs.map((song, i) => (
              <div
                key={song.id}
                className="song-card fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/song/${song.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/song/${song.id}`)}
              >
                <img
                  className="song-card-art"
                  src={song.art}
                  alt=""
                  loading="lazy"
                />
                <div className="song-card-info">
                  <div className="song-card-title">{song.title}</div>
                  <div className="song-card-artist">{song.artist}</div>
                </div>
                <button 
                  className="save-btn remove-btn"
                  onClick={(e) => removeSong(e, song.id)}
                  title="Remove from saved"
                  aria-label="Remove from saved"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">♥</div>
            <p className="empty-state-text">
              You haven't saved any songs yet.<br/>
              Explore and click the heart icon on a song page to save it.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
