/**
 * HomePage-Komponente
 *
 * Hauptseite der Anwendung. Enthält:
 * - Header mit Titel und "Spiel hinzufügen"-Button
 * - Suchleiste für die Titelsuche
 * - Fehlermeldungsanzeige
 * - GameList mit allen geladenen Spielen
 * - GameForm als Modal beim Erstellen/Bearbeiten
 */
import React, { useState, useMemo } from 'react';
import { Game } from '../../types/Game';
import { useGames } from '../../hooks/useGames';
import SearchBar from '../../components/SearchBar/SearchBar';
import GameList from '../../components/GameList/GameList';
import GameForm from '../../components/GameForm/GameForm';
import './HomePage.css';

type SortOrder = 'asc' | 'desc' | null;

const HomePage: React.FC = () => {
  const { games, loading, error, fetchGames, search, addGame, editGame, removeGame } = useGames();
  const [showForm, setShowForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const sortedGames = useMemo(() => {
    if (!sortOrder) return games;
    return [...games].sort((a, b) => {
      const dateA = new Date(a.releaseDate).getTime();
      const dateB = new Date(b.releaseDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [games, sortOrder]);

  const handleSortToggle = () => {
    setSortOrder(prev => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  };

  const handleEdit = (game: Game) => {
    setSelectedGame(game);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedGame(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (game: Game) => {
    const saved = selectedGame?.id
      ? await editGame(selectedGame.id, game)
      : await addGame(game);

    if (!saved) return;

    setShowForm(false);
    setSelectedGame(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedGame(null);
  };

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div className="home-page__header-content">
          {/* Logo & Tagline */}
          <div className="home-page__logo">
            <h1 className="home-page__headline">Games Library</h1>
            <p className="home-page__tagline">Your Personal Gaming Universe</p>
          </div>

          {/* Stats */}
          <div className="home-page__stats">
            <div className="home-page__stat">
              <span className="home-page__stat-value">{loading ? '–' : games.length}</span>
              <span className="home-page__stat-label">Games</span>
            </div>
            <div className="home-page__stat-divider" />
            <div className="home-page__stat">
              <span className="home-page__stat-value">∞</span>
              <span className="home-page__stat-label">Fun</span>
            </div>
          </div>

          {/* Add button */}
          <button className="home-page__add-btn" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Add Game</span>
          </button>
        </div>

        {/* Search + Sort */}
        <div className="home-page__search-wrapper">
          <SearchBar onSearch={search} onReset={fetchGames} />
          <button
            className={`home-page__sort-btn ${sortOrder ? 'home-page__sort-btn--active' : ''}`}
            onClick={handleSortToggle}
            title={
              sortOrder === 'desc' ? 'Sortiert: Neueste zuerst – klicken für Älteste zuerst'
              : sortOrder === 'asc' ? 'Sortiert: Älteste zuerst – klicken zum Zurücksetzen'
              : 'Nach Release-Datum sortieren'
            }
          >
            {/* Calendar icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="home-page__sort-label">
              {sortOrder === 'desc' ? 'Newest' : sortOrder === 'asc' ? 'Oldest' : 'Date'}
            </span>
            {/* Arrow icon */}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`home-page__sort-arrow ${sortOrder === 'asc' ? 'home-page__sort-arrow--up' : ''}`}
            >
              {sortOrder === null
                ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                : <polyline points="6 9 12 15 18 9"/>
              }
            </svg>
          </button>
        </div>
      </header>

      <main className="home-page__main">
        {error && (
          <div className="home-page__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        <GameList games={sortedGames} loading={loading} onEdit={handleEdit} onDelete={removeGame} />
      </main>

      {showForm && (
        <GameForm
          initialData={selectedGame}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default HomePage;
