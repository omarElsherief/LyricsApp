import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedSongs, deleteSavedSong } from '../api';

export default function SavedSongsPage() {
  const navigate = useNavigate();
  const [savedSongs, setSavedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSaved = useCallback(async () => {
    try {
      setError(null);
      const songs = await getSavedSongs();
      setSavedSongs(songs);
    } catch (err) {
      console.error('Failed to load saved songs:', err);
      setError('Could not load saved songs. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const removeSong = async (e, id) => {
    e.stopPropagation();
    // Optimistically remove from UI
    setSavedSongs((prev) => prev.filter((s) => String(s.id) !== String(id)));
    try {
      await deleteSavedSong(id);
    } catch (err) {
      console.error('Failed to delete saved song:', err);
      // Re-fetch to restore state if delete failed
      loadSaved();
    }
  };

  return (
    <div id="saved-songs-page">
      <section className="results-section fade-in" style={{ paddingTop: '40px' }}>
        <h1 className="search-hero-title" style={{ fontSize: '2.2rem', marginBottom: '32px' }}>
          Saved <span>Songs</span>
        </h1>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Loading saved songs…</span>
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠</div>
            <p className="empty-state-text">{error}</p>
          </div>
        )}

        {!loading && !error && savedSongs.length > 0 && (
          <div className="results-list">
            {savedSongs.map((song, i) => (
              <div
                key={song.id}
                className="song-card fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/song/${song.id}`, { 
                  state: { song: { title: song.title, primary_artist: { name: song.artist }, song_art_image_thumbnail_url: song.album_art } } 
                })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/song/${song.id}`, {
                  state: { song: { title: song.title, primary_artist: { name: song.artist }, song_art_image_thumbnail_url: song.album_art } } 
                })}
              >
                {song.album_art && (
                  <img
                    className="song-card-art"
                    src={song.album_art}
                    alt=""
                    loading="lazy"
                  />
                )}
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
        )}

        {!loading && !error && savedSongs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">♥</div>
            <p className="empty-state-text">
              You haven't saved any songs yet.<br />
              Explore and click the heart icon on a song page to save it.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
