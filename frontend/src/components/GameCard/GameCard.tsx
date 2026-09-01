/**
 * GameCard-Komponente
 *
 * Zeigt ein einzelnes Spiel als Karte an.
 * Bietet Schaltflächen zum Bearbeiten und Löschen.
 */
import React, { useEffect, useState } from 'react';
import { Game } from '../../types/Game';
import './GameCard.css';

interface Props {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (id: number) => void;
}

const GameCard: React.FC<Props> = ({ game, onEdit, onDelete }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = !!game.imageUrl && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [game.imageUrl]);

  return (
    <div className="game-card">
      {/* Image Area */}
      <div className="game-card__image-wrapper">
        {hasImage ? (
          <>
            <img
              src={game.imageUrl}
              alt={game.title}
              className="game-card__image"
              onError={() => setImageFailed(true)}
            />
            <div className="game-card__image-overlay" />
          </>
        ) : (
          <div className="game-card__no-image">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
            </svg>
            <span>No Image</span>
          </div>
        )}

        {/* Release date badge */}
        <div className="game-card__badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {new Date(game.releaseDate).toLocaleDateString('de-CH')}
        </div>
      </div>

      {/* Body */}
      <div className="game-card__body">
        <h2 className="game-card__title">{game.title}</h2>
        {game.description && (
          <p className="game-card__description">{game.description}</p>
        )}

        {/* Action Buttons */}
        <div className="game-card__actions">
          <button className="game-card__btn game-card__btn--edit" onClick={() => onEdit(game)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button
            className="game-card__btn game-card__btn--delete"
            onClick={() => game.id && onDelete(game.id)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
