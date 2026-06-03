import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { geniusFetch } from '../api';
import SongCard from '../components/SongCard';

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  // Fetch artist info
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setArtist(null);
    setSongs([]);
    setPage(1);
    setHasMore(true);
    setAlbums([]);

    geniusFetch(`/artists/${id}`)
      .then((data) => {
        if (cancelled) return;
        setArtist(data.response?.artist);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  // Fetch artist songs
  useEffect(() => {
    if (!artist) return;
    let cancelled = false;

    setLoadingSongs(true);
    geniusFetch(`/artists/${id}/songs?sort=popularity&per_page=20&page=${page}`)
      .then((data) => {
        if (cancelled) return;
        const newSongs = data.response?.songs || [];
        if (newSongs.length < 20) setHasMore(false);
        setSongs((prev) => (page === 1 ? newSongs : [...prev, ...newSongs]));
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingSongs(false);
      });

    return () => { cancelled = true; };
  }, [artist, id, page]);

  // Extract albums from top songs
  useEffect(() => {
    if (songs.length === 0 || albums.length > 0) return;
    
    let cancelled = false;
    setLoadingAlbums(true);

    const topSongIds = songs.slice(0, 8).map(s => s.id);
    
    Promise.allSettled(
      topSongIds.map(sid => geniusFetch(`/songs/${sid}`))
    ).then(results => {
      if (cancelled) return;
      const uniqueAlbums = [];
      const seenIds = new Set();
      
      results.forEach(res => {
        if (res.status === 'fulfilled' && res.value.response?.song?.album) {
          const album = res.value.response.song.album;
          if (!seenIds.has(album.id)) {
            seenIds.add(album.id);
            uniqueAlbums.push(album);
          }
        }
      });
      
      setAlbums(uniqueAlbums);
      setLoadingAlbums(false);
    });

    return () => { 
      cancelled = true; 
    };
  }, [songs, albums.length]);

  if (loading) {
    return (
      <div className="loading-container" id="artist-page-loading">
        <div className="loading-spinner" />
        <span className="loading-text">Loading artist…</span>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="error-message" id="artist-page-error">
        <p>Artist not found.</p>
        <button className="page-back" onClick={() => navigate('/')}>
          ← Back to search
        </button>
      </div>
    );
  }

  return (
    <div id="artist-page">
      <button className="page-back fade-in" onClick={() => navigate(-1)} id="artist-back-btn">
        ← Back
      </button>

      {/* Artist Header */}
      <header className="artist-header fade-in fade-in-delay-1">
        <img
          className="artist-avatar"
          src={artist.image_url}
          alt={artist.name}
        />
        <h1 className="artist-name">{artist.name}</h1>
        <p className="artist-meta">
          {songs.length > 0 ? `${songs.length}${hasMore ? '+' : ''} songs` : ''}
        </p>
      </header>

      {/* Artist Bio */}
      {artist.description?.plain && artist.description.plain !== '?' && (
        <section className="fade-in fade-in-delay-1" style={{ marginBottom: '40px' }}>
          <h2 className="artist-songs-heading">About</h2>
          <div className="lyrics-body" style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {artist.description.plain}
          </div>
        </section>
      )}

      {/* Albums List */}
      <section className="fade-in fade-in-delay-2" style={{ marginBottom: '40px' }}>
        <h2 className="artist-songs-heading">Top Albums</h2>
        {loadingAlbums ? (
          <div className="loading-container" style={{ padding: '20px 0' }}>
            <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
          </div>
        ) : albums.length > 0 ? (
          <div className="albums-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {albums.map((album, i) => (
              <div 
                key={album.id} 
                className="album-card" 
                onClick={() => navigate(`/album/${album.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/album/${album.id}`)}
                style={{ cursor: 'pointer', transition: 'transform var(--transition-fast)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <img 
                  src={album.cover_art_url} 
                  alt={album.name} 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '8px', boxShadow: 'var(--shadow-sm)' }} 
                />
                <div style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '4px' }}>{album.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No albums found.</p>
        )}
      </section>

      {/* Songs List */}
      <section className="fade-in fade-in-delay-3" id="artist-songs-section">
        <h2 className="artist-songs-heading">Popular Songs</h2>
        <div className="artist-songs-list">
          {songs.map((song, i) => (
            <SongCard
              key={song.id}
              song={song}
            />
          ))}

          {loadingSongs && (
            <div className="loading-container" style={{ padding: '32px 0' }}>
              <div className="loading-spinner" />
            </div>
          )}

          {!loadingSongs && hasMore && songs.length > 0 && (
            <button
              className="page-back"
              onClick={() => setPage((p) => p + 1)}
              style={{
                alignSelf: 'center',
                margin: '24px auto',
                display: 'block',
                color: 'var(--color-sage)',
              }}
              id="load-more-btn"
            >
              Load more songs →
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
