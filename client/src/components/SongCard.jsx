import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkSavedSong, saveSong, deleteSavedSong, fetchLyrics } from '../api';

/**
 * Reusable song card with an inline save/unsave toggle button.
 * @param {{ song: { id, title, primary_artist, song_art_image_thumbnail_url }, style?: object }} props
 */
export default function SongCard({ song, style }) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check saved status on mount
  useEffect(() => {
    let cancelled = false;
    checkSavedSong(song.id)
      .then(({ saved }) => { if (!cancelled) setIsSaved(saved); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [song.id]);

  const handleSave = async (e) => {
    e.stopPropagation(); // don't navigate when clicking save
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        await deleteSavedSong(song.id);
        setIsSaved(false);
      } else {
        // Fetch lyrics before saving so it's instantly available next time
        const lyrics = await fetchLyrics(song.primary_artist?.name, song.title).catch(() => null);
        
        await saveSong({
          id: song.id,
          title: song.title,
          artist: song.primary_artist?.name,
          albumArt: song.song_art_image_thumbnail_url,
          lyrics: lyrics,
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('SongCard save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div
      className="song-card fade-in"
      style={style}
      onClick={() => navigate(`/song/${song.id}`, { state: { song } })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/song/${song.id}`, { state: { song } })}
      id={`song-card-${song.id}`}
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

      {/* Inline save button */}
      <button
        className={`card-save-btn ${isSaved ? 'saved' : ''}`}
        onClick={handleSave}
        disabled={saveLoading}
        title={isSaved ? 'Remove from saved' : 'Save'}
        aria-label={isSaved ? 'Remove from saved' : 'Save song'}
      >
        {saveLoading ? '…' : isSaved ? '♥' : '♡'}
      </button>

      <span className="song-card-arrow" aria-hidden="true">→</span>
    </div>
  );
}
