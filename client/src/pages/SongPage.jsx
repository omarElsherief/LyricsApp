import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { geniusFetch, fetchLyrics } from '../api';

export default function SongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loadingSong, setLoadingSong] = useState(true);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Check saved status on load
  useEffect(() => {
    if (song) {
      const saved = JSON.parse(localStorage.getItem('lyriq_saved_songs')) || [];
      setIsSaved(saved.some(s => s.id === song.id));
    }
  }, [song]);

  const toggleSave = () => {
    if (!song) return;
    const saved = JSON.parse(localStorage.getItem('lyriq_saved_songs')) || [];
    let updated;
    
    if (isSaved) {
      updated = saved.filter(s => s.id !== song.id);
    } else {
      updated = [{
        id: song.id,
        title: song.title,
        artist: song.primary_artist?.name,
        art: song.song_art_image_thumbnail_url
      }, ...saved];
    }
    
    localStorage.setItem('lyriq_saved_songs', JSON.stringify(updated));
    setIsSaved(!isSaved);
    window.dispatchEvent(new Event('storage'));
  };

  // Fetch song details
  useEffect(() => {
    let cancelled = false;
    setLoadingSong(true);
    setSong(null);
    setLyrics(null);
    setLyricsError(null);

    geniusFetch(`/songs/${id}`)
      .then((data) => {
        if (cancelled) return;
        const s = data.response?.song;
        setSong(s);
        setLoadingSong(false);

        // Now fetch lyrics
        if (s) {
          setLoadingLyrics(true);
          fetchLyrics(s.primary_artist?.name, s.title)
            .then((l) => {
              if (!cancelled) setLyrics(l);
            })
            .catch(() => {
              if (!cancelled) setLyricsError('Lyrics not available for this song.');
            })
            .finally(() => {
              if (!cancelled) setLoadingLyrics(false);
            });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingSong(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loadingSong) {
    return (
      <div className="loading-container" id="song-page-loading">
        <div className="loading-spinner" />
        <span className="loading-text">Loading song…</span>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="error-message" id="song-page-error">
        <p>Song not found.</p>
        <button className="page-back" onClick={() => navigate('/')}>
          ← Back to search
        </button>
      </div>
    );
  }

  return (
    <div id="song-page">
      <button className="page-back fade-in" onClick={() => navigate(-1)} id="song-back-btn">
        ← Back
      </button>

      {/* Song Header */}
      <header className="song-header fade-in fade-in-delay-1">
        <img
          className="song-header-art"
          src={song.song_art_image_url}
          alt={`${song.title} artwork`}
        />
        <div className="song-header-info">
          <span className="song-header-label">Song</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 className="song-header-title" style={{ marginBottom: 0 }}>{song.title}</h1>
            <button 
              className={`save-btn ${isSaved ? 'saved' : ''}`}
              onClick={toggleSave}
              title={isSaved ? "Remove from saved" : "Save song"}
              aria-label={isSaved ? "Remove from saved" : "Save song"}
            >
              {isSaved ? '♥' : '♡'}
            </button>
          </div>
          <p
            className="song-header-artist"
            onClick={() => navigate(`/artist/${song.primary_artist?.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && navigate(`/artist/${song.primary_artist?.id}`)
            }
            id="song-artist-link"
          >
            {song.primary_artist?.name}
          </p>
        </div>
      </header>

      {/* Lyrics */}
      <section className="lyrics-container fade-in fade-in-delay-2" id="lyrics-section">
        <h2 className="lyrics-section-title">Lyrics</h2>

        {loadingLyrics && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Fetching lyrics…</span>
          </div>
        )}

        {!loadingLyrics && lyricsError && (
          <p className="error-message">{lyricsError}</p>
        )}

        {!loadingLyrics && lyrics && (
          <div className="lyrics-body" id="lyrics-body">
            {lyrics}
          </div>
        )}
      </section>
    </div>
  );
}
