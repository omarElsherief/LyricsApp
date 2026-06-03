import { Routes, Route, Link } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import SongPage from './pages/SongPage';
import ArtistPage from './pages/ArtistPage';
import SavedSongsPage from './pages/SavedSongsPage';
import AlbumPage from './pages/AlbumPage';

export default function App() {
  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" id="logo-link">
            <span className="navbar-logo-icon">♪</span>
            Lyriq
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/saved" className="navbar-tag" style={{ cursor: 'pointer', background: 'transparent', color: 'var(--color-text-secondary)', padding: 0 }} id="saved-nav-link">
              Saved
            </Link>
            <span className="navbar-tag">lyrics finder</span>
          </div>
        </div>
      </nav>

      <main className="app-container">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/saved" element={<SavedSongsPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
        </Routes>
      </main>
    </>
  );
}
