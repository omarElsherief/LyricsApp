import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { geniusFetch } from '../api';

export default function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      geniusFetch(`/albums/${id}`),
      geniusFetch(`/albums/${id}/tracks`)
    ])
      .then(([albumData, tracksData]) => {
        if (cancelled) return;
        setAlbum(albumData.response?.album);
        setTracks(tracksData.response?.tracks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch album:', err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container" id="album-page-loading">
        <div className="loading-spinner" />
        <span className="loading-text">Loading album…</span>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="error-message" id="album-page-error">
        <p>Album not found.</p>
        <button className="page-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div id="album-page">
      <button className="page-back fade-in" onClick={() => navigate(-1)} id="album-back-btn">
        ← Back
      </button>

      {/* Album Header */}
      <header className="song-header fade-in fade-in-delay-1" style={{ alignItems: 'flex-end', marginBottom: '40px' }}>
        <img
          className="song-header-art"
          src={album.cover_art_url}
          alt={album.name}
        />
        <div className="song-header-info">
          <span className="song-header-label">Album</span>
          <h1 className="song-header-title">{album.name}</h1>
          <p className="song-header-artist" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span 
              onClick={() => navigate(`/artist/${album.artist?.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/artist/${album.artist?.id}`)}
              style={{ cursor: 'pointer', transition: 'color var(--transition-fast)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-sage)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              {album.artist?.name}
            </span>
            <span style={{ fontSize: '0.7em', color: 'var(--color-text-tertiary)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {album.release_date_for_display || album.release_date_components?.year}
            </span>
          </p>
        </div>
      </header>

      {/* Tracklist */}
      <section className="fade-in fade-in-delay-2" id="album-tracks-section">
        <h2 className="artist-songs-heading">Tracklist</h2>
        
        {tracks.length > 0 ? (
          <div className="tracklist" style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '80px' }}>
            {tracks.map((track) => (
              <div
                key={track.song.id}
                className="song-card"
                onClick={() => navigate(`/song/${track.song.id}`, {
                  state: { song: { title: track.song.title, primary_artist: { name: track.song.primary_artist?.name || album.artist?.name }, song_art_image_thumbnail_url: album.cover_art_url } }
                })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/song/${track.song.id}`, {
                  state: { song: { title: track.song.title, primary_artist: { name: track.song.primary_artist?.name || album.artist?.name }, song_art_image_thumbnail_url: album.cover_art_url } }
                })}
                style={{ padding: '12px 16px' }}
              >
                <div style={{ color: 'var(--color-text-tertiary)', width: '24px', fontSize: '0.85rem' }}>
                  {track.number}
                </div>
                <div className="song-card-info">
                  <div className="song-card-title">{track.song.title}</div>
                  {track.song.primary_artist?.id !== album.artist?.id && (
                    <div className="song-card-artist">{track.song.primary_artist?.name}</div>
                  )}
                </div>
                <span className="song-card-arrow" aria-hidden="true">→</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No tracklist available.</p>
        )}
      </section>
    </div>
  );
}
