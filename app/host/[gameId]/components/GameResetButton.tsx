"use client";

import { useState } from "react";

interface GameResetButtonProps {
  gameId: string;
  onResetComplete: () => void;
}

export function GameResetButton({
  gameId,
  onResetComplete,
}: GameResetButtonProps) {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/${gameId}/reset`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "No se pudo reiniciar el juego");
      }

      setShowConfirm(false);
      onResetComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reiniciar el juego");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-2">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={resetting}
          aria-label="Reiniciar juego"
          className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50"
        >
          Reiniciar juego
        </button>
      ) : (
        <div className="bg-amber-950/40 border border-amber-700 rounded-lg p-4">
          <p className="text-amber-300 font-medium mb-3">
            ¿Estás seguro de que quieres reiniciar este juego?
          </p>
          <p className="text-amber-200 text-sm mb-4">
            Esto eliminará a todos los jugadores, borrará todas las
            estimaciones y apuestas, y reiniciará el juego a la primera
            pregunta. Las preguntas se conservarán.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50"
            >
              {resetting ? "Reiniciando..." : "Sí, reiniciar juego"}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={resetting}
              className="px-4 py-2 bg-primary-700/40 text-primary-100 rounded-md hover:bg-primary-700/60 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
