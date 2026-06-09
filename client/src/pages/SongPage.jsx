import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { geniusFetch, fetchLyrics, checkSavedSong, saveSong, deleteSavedSong, getCustomLyrics, saveCustomLyrics } from '../api';

export default function SongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSong = location.state?.song;
  
  const [song, setSong] = useState(initialSong || null);
  const [lyrics, setLyrics] = useState(null);
  const [loadingSong, setLoadingSong] = useState(true);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Custom lyrics modal state
  const [showAddLyricsModal, setShowAddLyricsModal] = useState(false);
  const [customLyricsInput, setCustomLyricsInput] = useState('');
  const [savingCustomLyrics, setSavingCustomLyrics] = useState(false);

  // Fetch song details + check saved status
  useEffect(() => {
    let cancelled = false;
    setLoadingSong(!initialSong); // Don't show full page loader if we have initial state
    setLyrics(null);
    setLyricsError(null);
    setIsSaved(false);

    async function loadData() {
      try {
        // 1. Immediately check if it's saved in DB (this is extremely fast)
        const { saved, songData } = await checkSavedSong(id).catch(() => ({ saved: false, songData: null }));
        if (cancelled) return;
        setIsSaved(saved);

        if (saved && songData) {
          // It's saved! We have everything we need, no network calls required.
          setSong({
            id: songData.id,
            title: songData.title,
            primary_artist: { name: songData.artist },
            song_art_image_url: songData.album_art,
            song_art_image_thumbnail_url: songData.album_art
          });
          setLoadingSong(false);
          if (songData.lyrics) {
            setLyrics(songData.lyrics);
            return; // We are fully loaded from local DB!
          }
        }

        // 2. If we aren't fully loaded, we need to fetch. 
        // We can do geniusFetch and fetchLyrics in parallel if we know the artist/title!
        const fetchTitle = songData?.title || initialSong?.title;
        const fetchArtist = songData?.artist || initialSong?.primary_artist?.name;
        
        let lyricsPromise = null;
        if (fetchTitle && fetchArtist) {
          setLoadingLyrics(true);
          lyricsPromise = fetchLyrics(fetchArtist, fetchTitle)
            .then(l => { if (!cancelled) setLyrics(l); })
            .catch(async () => { 
              if (cancelled) return;
              try {
                const custom = await getCustomLyrics(id);
                if (custom && !cancelled) {
                  setLyrics(custom);
                  setLyricsError(null);
                } else if (!cancelled) {
                  setLyricsError('Lyrics not available for this song.');
                }
              } catch (e) {
                if (!cancelled) setLyricsError('Lyrics not available for this song.');
              }
            })
            .finally(() => { if (!cancelled) setLoadingLyrics(false); });
        }

        // We still fetch Genius data to get high-res art and exact details
        const geniusPromise = geniusFetch(`/songs/${id}`)
          .then(data => {
            if (cancelled) return;
            const s = data.response?.song;
            if (s) {
              setSong(s);
              setLoadingSong(false);
              
              // If we didn't start the lyrics promise above because we lacked state, start it now
              if (!lyricsPromise) {
                setLoadingLyrics(true);
                fetchLyrics(s.primary_artist?.name, s.title)
                  .then(l => { if (!cancelled) setLyrics(l); })
                  .catch(async () => {
                    if (cancelled) return;
                    try {
                      const custom = await getCustomLyrics(s.id);
                      if (custom && !cancelled) {
                        setLyrics(custom);
                        setLyricsError(null);
                      } else if (!cancelled) {
                        setLyricsError('Lyrics not available for this song.');
                      }
                    } catch (e) {
                      if (!cancelled) setLyricsError('Lyrics not available for this song.');
                    }
                  })
                  .finally(() => { if (!cancelled) setLoadingLyrics(false); });
              }
            }
          })
          .catch(() => { if (!cancelled) setLoadingSong(false); });

        await Promise.all([lyricsPromise, geniusPromise]);
      } catch (err) {
        if (!cancelled) setLoadingSong(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [id]);

  const toggleSave = async () => {
    if (!song || saveLoading) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        await deleteSavedSong(song.id);
        setIsSaved(false);
      } else {
        await saveSong({
          id: song.id,
          title: song.title,
          artist: song.primary_artist?.name,
          albumArt: song.song_art_image_thumbnail_url,
          lyrics: lyrics || null,
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Save toggle failed:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveCustomLyrics = async () => {
    if (!customLyricsInput.trim() || !song || savingCustomLyrics) return;
    setSavingCustomLyrics(true);
    try {
      await saveCustomLyrics({
        songId: song.id,
        title: song.title,
        artist: song.primary_artist?.name,
        lyrics: customLyricsInput.trim()
      });
      setLyrics(customLyricsInput.trim());
      setLyricsError(null);
      setShowAddLyricsModal(false);
    } catch (err) {
      console.error('Failed to save custom lyrics:', err);
      alert('Failed to save custom lyrics. Please try again.');
    } finally {
      setSavingCustomLyrics(false);
    }
  };

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
              className={`save-btn ${isSaved ? 'saved' : ''} ${saveLoading ? 'saving' : ''}`}
              onClick={toggleSave}
              disabled={saveLoading}
              title={isSaved ? 'Remove from saved' : 'Save song'}
              aria-label={isSaved ? 'Remove from saved' : 'Save song'}
            >
              {saveLoading ? '…' : isSaved ? '♥' : '♡'}
            </button>
          </div>
          <p
            className="song-header-artist"
            onClick={() => navigate(`/artist/${song.primary_artist?.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/artist/${song.primary_artist?.id}`)}
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

        {!loadingLyrics && lyricsError && !lyrics && (
          <div className="error-message">
            <p>{lyricsError}</p>
            <button 
              className="btn-primary fade-in" 
              onClick={() => { setCustomLyricsInput(''); setShowAddLyricsModal(true); }}
              style={{ marginTop: '16px' }}
            >
              Add Lyrics
            </button>
          </div>
        )}

        {!loadingLyrics && lyrics && (
          <div className="lyrics-body" id="lyrics-body">
            {lyrics}
          </div>
        )}
      </section>

      {/* Add Lyrics Modal */}
      {showAddLyricsModal && (
        <div className="modal-overlay fade-in">
          <div className="modal-content">
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Add Custom Lyrics</h3>
            <textarea
              className="lyrics-textarea"
              placeholder="Paste lyrics here..."
              value={customLyricsInput}
              onChange={(e) => setCustomLyricsInput(e.target.value)}
              disabled={savingCustomLyrics}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                onClick={() => setShowAddLyricsModal(false)}
                disabled={savingCustomLyrics}
                style={{ padding: '8px 16px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSaveCustomLyrics}
                disabled={savingCustomLyrics || !customLyricsInput.trim()}
              >
                {savingCustomLyrics ? 'Saving...' : 'Save Lyrics'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
