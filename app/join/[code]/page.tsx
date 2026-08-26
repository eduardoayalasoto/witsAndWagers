"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [displayName, setDisplayName] = useState("");
  const [gameTitle, setGameTitle] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate join code exists
  useEffect(() => {
    const validateCode = async () => {
      try {
        // We don't have a dedicated endpoint to check if code exists,
        // so we'll just show the form and handle errors on submit
        setLoading(false);
      } catch (err) {
        setError("Código de juego inválido");
        setLoading(false);
      }
    };

    validateCode();
  }, [code]);

  const validateDisplayName = (name: string): string | null => {
    if (!name.trim()) {
      return "Tu nombre es obligatorio";
    }
    if (name.length < 1 || name.length > 30) {
      return "El nombre debe tener entre 1 y 30 caracteres";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateDisplayName(displayName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/join/${code}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudo unir al juego");
      }

      const data = await response.json();

      // Store player ID in local storage
      localStorage.setItem("playerId", data.playerId);
      localStorage.setItem("gameId", data.gameId);
      localStorage.setItem("displayName", displayName.trim());

      // Redirect to player view
      router.push(`/play/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir al juego");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="text-xl text-primary-200">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-primary-900 border border-primary-700 p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Unirse al juego
          </h1>
          <div className="text-center mb-6">
            <span className="text-sm text-primary-300">Código: </span>
            <span className="text-lg font-mono font-bold text-white">
              {code}
            </span>
          </div>

          {gameTitle && (
            <div className="text-center mb-6">
              <div className="text-sm text-primary-300">Juego</div>
              <div className="text-xl font-bold text-white">{gameTitle}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 text-lg bg-white/90"
                placeholder="Ingresa tu nombre"
                maxLength={30}
                autoFocus
              />
              <div className="mt-1 text-sm text-primary-400">
                {displayName.length}/30 caracteres
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-700 text-white py-3 px-4 rounded-md hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {isSubmitting ? "Uniéndose..." : "Unirse al juego"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
