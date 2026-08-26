"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateQRCode } from "@/lib/qrcode";
import { useGameChannel } from "@/lib/hooks/useGameChannel";
import { QuestionListEditor } from "./components/QuestionListEditor";
import { FileUploadButton } from "./components/FileUploadButton";
import { GameResetButton } from "./components/GameResetButton";
import { AddQuestionButton } from "./components/AddQuestionButton";

interface GameState {
  game: {
    id: string;
    title: string;
    joinCode: string;
    currentPhase: "guessing" | "betting" | "reveal";
    currentQuestionId: string | null;
  };
  questions: Array<{
    id: string;
    text: string;
    subText: string | null;
    correctAnswer: string;
    answerFormat: "plain" | "currency" | "date" | "percentage";
    followUpNotes: string | null;
    order: number;
    roundCurrency: boolean | null;
  }>;
  players: Array<{
    id: string;
    displayName: string;
    score: number;
  }>;
  guesses: Array<{
    id: string;
    questionId: string;
    playerId: string;
    guess: string;
  }>;
  bets: Array<{
    id: string;
    questionId: string;
    playerId: string;
    guessId: string | null;
    betOnZero: number;
  }>;
}

export default function HostDashboardPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showQuestionManagement, setShowQuestionManagement] = useState(true);

  // Check if game is active (has players or not in initial state)
  useEffect(() => {
    if (gameState) {
      const hasPlayers = gameState.players.length > 0;
      const notFirstQuestion =
        gameState.questions.length > 0 &&
        gameState.game.currentQuestionId !== gameState.questions[0]?.id;
      const notGuessingPhase = gameState.game.currentPhase !== "guessing";

      setIsGameActive(hasPlayers || notFirstQuestion || notGuessingPhase);
    }
  }, [gameState]);

  // Advance to next phase
  const advancePhase = async () => {
    if (!gameState) return;

    const phaseMap: Record<string, string> = {
      guessing: "betting",
      betting: "reveal",
      reveal: "guessing",
    };

    const targetPhase = phaseMap[gameState.game.currentPhase];

    setIsAdvancing(true);
    try {
      const response = await fetch(`/api/games/${gameId}/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetPhase }),
      });

      if (!response.ok) {
        throw new Error("No se pudo avanzar de fase");
      }

      await fetchGameState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo avanzar de fase");
    } finally {
      setIsAdvancing(false);
    }
  };

  // Fetch game state
  const fetchGameState = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/state`);
      if (!response.ok) {
        throw new Error("No se pudo obtener el estado del juego");
      }
      const data = await response.json();
      setGameState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el juego");
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  const { isConnected, isReconnecting } = useGameChannel({
    gameId,
    onPlayerJoined: () => {
      fetchGameState();
    },
    onPhaseChange: () => {
      fetchGameState();
    },
    onGuessSubmitted: () => {
      fetchGameState();
    },
    onBetPlaced: () => {
      fetchGameState();
    },
    onScoreUpdate: () => {
      fetchGameState();
    },
  });

  // Fallback polling when realtime is not connected
  useEffect(() => {
    if (!isConnected && !isReconnecting) {
      const interval = setInterval(() => {
        fetchGameState();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isReconnecting]);

  // Generate QR code
  useEffect(() => {
    if (gameState?.game.joinCode) {
      const joinUrl = `${window.location.origin}/join/${gameState.game.joinCode}`;
      generateQRCode(joinUrl).then(setQrCodeUrl);
    }
  }, [gameState?.game.joinCode]);

  // Initial fetch
  useEffect(() => {
    fetchGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="text-xl text-primary-200">Cargando juego...</div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="text-xl text-red-400">{error || "Juego no encontrado"}</div>
      </div>
    );
  }

  const currentQuestion = gameState.questions.find(
    (q) => q.id === gameState.game.currentQuestionId,
  );

  const currentQuestionIndex = gameState.questions.findIndex(
    (q) => q.id === gameState.game.currentQuestionId,
  );

  // Count submissions for current question
  const guessCount = gameState.guesses.filter(
    (g) => g.questionId === gameState.game.currentQuestionId,
  ).length;

  const betCount = gameState.bets.filter(
    (b) => b.questionId === gameState.game.currentQuestionId,
  ).length;

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case "guessing":
        return "Fase de estimación";
      case "betting":
        return "Fase de apuestas";
      case "reveal":
        return "Fase de revelación";
      default:
        return phase;
    }
  };

  const getNextPhaseLabel = (phase: string) => {
    switch (phase) {
      case "guessing":
        return "Iniciar apuestas";
      case "betting":
        return "Revelar respuesta";
      case "reveal":
        return "Siguiente pregunta";
      default:
        return "Siguiente fase";
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">
            {gameState.game.title}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-sm text-primary-300">Código del juego</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {gameState.game.joinCode}
                </div>
              </div>
              <div>
                <div className="text-sm text-primary-300">Jugadores</div>
                <div className="text-2xl font-bold text-white">
                  {gameState.players.length}
                </div>
              </div>
            </div>
            <a
              href={`/display/${gameId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-700 text-white px-6 py-3 rounded-lg hover:bg-primary-800 active:bg-primary-900 font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Abrir pantalla
            </a>
          </div>
        </div>

        {/* Question Management Section */}
        <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Gestión de preguntas
            </h2>
            <button
              onClick={() => setShowQuestionManagement(!showQuestionManagement)}
              className="text-secondary-300 hover:text-secondary-200 font-medium"
            >
              {showQuestionManagement ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {showQuestionManagement && (
            <div className="space-y-6">
              <div className="flex gap-4 flex-wrap">
                <FileUploadButton
                  gameId={gameId}
                  onImportComplete={() => fetchGameState()}
                  disabled={isGameActive}
                />
                <a
                  href="/sample-questions.csv"
                  download="sample-questions.csv"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 text-white rounded-md hover:bg-primary-800 active:bg-primary-900 font-medium whitespace-nowrap"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  CSV de ejemplo
                </a>
                <GameResetButton
                  gameId={gameId}
                  onResetComplete={() => fetchGameState()}
                />
              </div>

              <AddQuestionButton
                gameId={gameId}
                onQuestionAdded={() => fetchGameState()}
                disabled={isGameActive}
              />

              <QuestionListEditor
                gameId={gameId}
                questions={gameState.questions.map((q) => ({
                  id: q.id,
                  gameId: gameId,
                  orderIndex: q.order,
                  text: q.text,
                  subText: q.subText,
                  correctAnswer: q.correctAnswer,
                  answerFormat: q.answerFormat,
                  followUpNotes: q.followUpNotes,
                  roundCurrency: q.roundCurrency,
                }))}
                isActive={isGameActive}
                onQuestionsChange={() => fetchGameState()}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Game Button - Show when game hasn't started */}
            {!currentQuestion && gameState.questions.length > 0 && (
              <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    ¿Listo para empezar?
                  </h2>
                  <p className="text-primary-200 mb-6">
                    Tienes {gameState.questions.length} pregunta
                    {gameState.questions.length !== 1 ? "s" : ""} y{" "}
                    {gameState.players.length} jugador
                    {gameState.players.length !== 1 ? "es" : ""} listos para
                    jugar.
                  </p>
                  <button
                    onClick={advancePhase}
                    disabled={isAdvancing}
                    className="bg-primary-700 text-white py-4 px-8 rounded-lg hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl"
                  >
                    {isAdvancing ? "Iniciando..." : "Iniciar juego"}
                  </button>
                </div>
              </div>
            )}

            {/* No Questions Message */}
            {!currentQuestion && gameState.questions.length === 0 && (
              <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Aún no hay preguntas
                  </h2>
                  <p className="text-primary-200">
                    Agrega preguntas arriba para iniciar el juego.
                  </p>
                </div>
              </div>
            )}

            {/* Current Question */}
            {currentQuestion && (
              <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-primary-300">
                    Pregunta {currentQuestionIndex + 1} de{" "}
                    {gameState.questions.length}
                  </div>
                  <div className="px-3 py-1 bg-primary-700 text-primary-50 rounded-full text-sm font-medium">
                    {getPhaseLabel(gameState.game.currentPhase)}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.subText && (
                  <p className="text-primary-200 mb-4">
                    {currentQuestion.subText}
                  </p>
                )}

                {/* Submission Counts */}
                <div className="flex gap-4 mb-4">
                  {gameState.game.currentPhase === "guessing" && (
                    <div className="bg-primary-900 border border-primary-700 px-4 py-2 rounded">
                      <span className="text-sm text-primary-300">Estimaciones: </span>
                      <span className="font-bold text-white">
                        {guessCount} / {gameState.players.length}
                      </span>
                    </div>
                  )}
                  {gameState.game.currentPhase === "betting" && (
                    <div className="bg-primary-900 border border-primary-700 px-4 py-2 rounded">
                      <span className="text-sm text-primary-300">Apuestas: </span>
                      <span className="font-bold text-white">
                        {betCount} / {gameState.players.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Correct Answer (hidden until reveal) */}
                {gameState.game.currentPhase === "reveal" && (
                  <div className="bg-secondary-900/40 border border-secondary-700 p-4 rounded mb-4">
                    <div className="text-sm text-secondary-300 mb-1">
                      Respuesta correcta
                    </div>
                    <div className="text-2xl font-bold text-secondary-50">
                      {currentQuestion.correctAnswer}
                    </div>
                    {currentQuestion.followUpNotes && (
                      <div className="mt-3 text-sm text-secondary-200">
                        {currentQuestion.followUpNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Phase Control Button */}
                <button
                  onClick={advancePhase}
                  disabled={isAdvancing}
                  className="w-full bg-primary-700 text-white py-3 px-4 rounded-md hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isAdvancing
                    ? "Procesando..."
                    : getNextPhaseLabel(gameState.game.currentPhase)}
                </button>
              </div>
            )}

            {/* Question List */}
            <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
              <h3 className="text-lg font-bold text-white mb-4">
                Todas las preguntas
              </h3>
              <div className="space-y-2">
                {gameState.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-3 rounded ${
                      question.id === gameState.game.currentQuestionId
                        ? "bg-secondary-800/50 border-2 border-secondary-500"
                        : "bg-primary-900"
                    }`}
                  >
                    <div className="font-medium text-white">
                      {index + 1}. {question.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
                <h3 className="text-lg font-bold text-white mb-4">
                  Unirse al juego
                </h3>
                <img
                  src={qrCodeUrl}
                  alt="Código QR"
                  className="w-full rounded bg-white p-2"
                />
                <div className="mt-4 text-center text-sm text-primary-300">
                  Escanea para unirte
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="bg-primary-800 p-6 rounded-lg shadow-xl border border-primary-700">
              <h3 className="text-lg font-bold text-white mb-4">Jugadores</h3>
              {gameState.players.length === 0 ? (
                <div className="text-primary-300 text-center py-4">
                  Aún no hay jugadores
                </div>
              ) : (
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-2 bg-primary-900 rounded"
                    >
                      <span className="font-medium text-white">
                        {player.displayName}
                      </span>
                      <span className="text-primary-300">{player.score} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
