/**
 * Custom Hook für die gesamte Spieleverwaltung.
 *
 * Kapselt State-Management und API-Aufrufe, sodass Komponenten
 * nur noch diesen Hook verwenden müssen und keine direkten API-Aufrufe
 * selbst durchführen.
 *
 * Zurückgegeben werden:
 * - `games`        – aktuell geladene Spieleliste
 * - `loading`      – true während einer laufenden Anfrage
 * - `error`        – Fehlermeldung oder null
 * - `fetchGames`   – alle Spiele neu laden
 * - `search`       – Titelsuche ausführen
 * - `addGame`      – neues Spiel anlegen
 * - `editGame`     – bestehendes Spiel aktualisieren
 * - `removeGame`   – Spiel löschen
 */
import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types/Game';
import * as api from '../api/gameApi';

export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllGames();
      setGames(data);
    } catch {
      setError('Fehler beim Laden der Spiele.');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (title: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchGames(title);
      setGames(data);
    } catch {
      setError('Fehler bei der Suche.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addGame = useCallback(async (game: Game) => {
    setError(null);
    try {
      const created = await api.createGame(game);
      setGames((prev) => [...prev, created]);
      return true;
    } catch {
      setError('Fehler beim Erstellen des Spiels.');
      return false;
    }
  }, []);

  const editGame = useCallback(async (id: number, game: Game) => {
    setError(null);
    try {
      const updated = await api.updateGame(id, game);
      setGames((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return true;
    } catch {
      setError('Fehler beim Aktualisieren des Spiels.');
      return false;
    }
  }, []);

  const removeGame = useCallback(async (id: number) => {
    setError(null);
    try {
      await api.deleteGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError('Fehler beim Löschen des Spiels.');
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, fetchGames, search, addGame, editGame, removeGame };
};

