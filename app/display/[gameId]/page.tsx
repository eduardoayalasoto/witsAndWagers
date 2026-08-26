"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGameChannel } from "@/lib/hooks/useGameChannel";
import { formatNumber } from "@/lib/format";
import { getResponsiveTextStyle } from "@/lib/display/responsiveText";
import FinalResultsScreen from "./components/FinalResultsScreen";
import { generateQRCode } from "@/lib/qrcode";

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
    orderIndex: number;
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

export default function DisplayViewPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [autoShowNav, setAutoShowNav] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Fetch game state
  const fetchGameState = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/state`);
      if (!response.ok) {
        throw new Error("Failed to fetch game state");
      }
      const data = await response.json();
      setGameState(data);
    } catch (err) {
      console.error("Failed to load game:", err);
    } finally {
      setLoading(false);
    }
  };

  // Advance to next phase
  // Advance to next phase with animation
  const advancePhaseWithAnimation = async () => {
    if (isTransitioning || !gameState) return;

    setIsTransitioning(true);

    // Exit animation (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Call the actual advance phase logic
    await advancePhaseInternal();

    // Force re-render with new content
    setContentKey((prev) => prev + 1);

    // Enter animation (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    setIsTransitioning(false);
  };

  // Internal advance phase logic
  const advancePhaseInternal = async () => {
    if (!gameState) return;

    const phaseMap: Record<string, string> = {
      guessing: "betting",
      betting: "reveal",
      reveal: "guessing",
    };

    // Special case: if no current question, we're starting the game
    // Stay in guessing phase to trigger first question setup
    const targetPhase = !gameState.game.currentQuestionId
      ? "guessing"
      : phaseMap[gameState.game.currentPhase];

    setIsAdvancing(true);

    // Reset auto-show and collapse navigation panel
    setAutoShowNav(false);
    setShowNavigation(false);

    try {
      const response = await fetch(`/api/games/${gameId}/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetPhase }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If game is complete, silently ignore - this is expected behavior
        if (errorData.error?.code === "GAME_COMPLETE") {
          console.log("Game is complete - staying on final results screen");
          return;
        }

        console.error("Advance phase error:", errorData);
        throw new Error(
          `Failed to advance phase: ${errorData.error?.message || response.statusText}`,
        );
      }

      await fetchGameState();
    } catch (err) {
      console.error("Failed to advance phase:", err);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Subscribe to realtime updates
  const { isConnected, isReconnecting } = useGameChannel({
    gameId,
    onPhaseChange: () => {
      fetchGameState();
    },
    onPlayerJoined: () => {
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
    onReconnect: () => {
      fetchGameState();
    },
  });

  // Fallback polling when realtime is not connected
  useEffect(() => {
    if (!isConnected && !isReconnecting) {
      const interval = setInterval(() => {
        fetchGameState();
      }, 3000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isReconnecting]);

  // Initial fetch
  useEffect(() => {
    fetchGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Calculate derived state
  const currentQuestion = gameState?.questions.find(
    (q) => q.id === gameState?.game.currentQuestionId,
  );

  const submittedGuesses =
    gameState?.guesses.filter(
      (g) => g.questionId === gameState?.game.currentQuestionId,
    ).length || 0;

  const submittedBets =
    gameState?.bets.filter(
      (b) => b.questionId === gameState?.game.currentQuestionId,
    ).length || 0;

  const totalPlayers = gameState?.players.length || 0;

  // Generate QR code
  useEffect(() => {
    if (gameState?.game.joinCode) {
      const joinUrl = `${window.location.origin}/join/${gameState.game.joinCode}`;
      generateQRCode(joinUrl).then(setQrCodeUrl);
    }
  }, [gameState?.game.joinCode]);

  // Auto-show navigation panel when all players complete their actions
  useEffect(() => {
    if (!currentQuestion) {
      setAutoShowNav(false);
      return;
    }

    const isComplete =
      (gameState?.game.currentPhase === "guessing" &&
        submittedGuesses === totalPlayers &&
        totalPlayers > 0) ||
      (gameState?.game.currentPhase === "betting" &&
        submittedBets === totalPlayers &&
        totalPlayers > 0);

    setAutoShowNav(isComplete);
  }, [
    currentQuestion,
    gameState?.game.currentPhase,
    submittedGuesses,
    submittedBets,
    totalPlayers,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-900 to-primary-950 flex items-center justify-center">
        <div className="text-3xl text-white">Cargando...</div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-900 to-primary-950 flex items-center justify-center">
        <div className="text-3xl text-white">Juego no encontrado</div>
      </div>
    );
  }

  // Sort players by score (descending)
  const sortedPlayers = [...gameState.players].sort(
    (a, b) => b.score - a.score,
  );

  // Detect game completion
  const isLastQuestion =
    currentQuestion &&
    gameState.questions.length > 0 &&
    currentQuestion.orderIndex ===
      Math.max(...gameState.questions.map((q) => q.orderIndex));

  const showFinalResults =
    gameState.game.currentPhase === "reveal" && isLastQuestion;

  // Get guesses for betting/reveal phase
  const currentGuesses = gameState.guesses
    .filter((g) => g.questionId === gameState.game.currentQuestionId)
    .map((g) => {
      const player = gameState.players.find((p) => p.id === g.playerId);
      return {
        ...g,
        playerName: player?.displayName || "Unknown",
        numericGuess: parseFloat(g.guess),
      };
    })
    .sort((a, b) => a.numericGuess - b.numericGuess);

  // Calculate responsive grid layout based on player count
  // Total boxes = player guesses + 1 (zero option)
  const totalBoxes = currentGuesses.length + 1;

  // Determine grid columns and sizing based on total boxes
  const getGridConfig = () => {
    if (totalBoxes <= 4) {
      return {
        cols: "grid-cols-2 md:grid-cols-3",
        padding: "p-12",
        numberSize: "text-7xl",
        nameSize: "text-xl",
        gap: "gap-8",
        maxWidth: "max-w-4xl",
      };
    } else if (totalBoxes <= 9) {
      return {
        cols: "grid-cols-3 md:grid-cols-4",
        padding: "p-10",
        numberSize: "text-6xl",
        nameSize: "text-lg",
        gap: "gap-6",
        maxWidth: "max-w-6xl",
      };
    } else if (totalBoxes <= 16) {
      return {
        cols: "grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        padding: "p-8",
        numberSize: "text-5xl",
        nameSize: "text-base",
        gap: "gap-4",
        maxWidth: "max-w-7xl",
      };
    } else {
      return {
        cols: "grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
        padding: "p-6",
        numberSize: "text-4xl",
        nameSize: "text-sm",
        gap: "gap-3",
        maxWidth: "max-w-7xl",
      };
    }
  };

  const gridConfig = getGridConfig();

  // Spanish labels for the current phase badge
  const phaseLabels: Record<string, string> = {
    guessing: "ADIVINANDO",
    betting: "APOSTANDO",
    reveal: "REVELANDO",
  };

  // Find closest guess for reveal phase
  let closestGuessId: string | null = null;
  if (gameState.game.currentPhase === "reveal" && currentQuestion) {
    const correctAnswer = parseFloat(currentQuestion.correctAnswer);
    let minDiff = Infinity;
    let closestGuess = 0;

    currentGuesses.forEach((guess) => {
      const diff = Math.abs(guess.numericGuess - correctAnswer);
      if (
        diff < minDiff ||
        (diff === minDiff && guess.numericGuess < closestGuess)
      ) {
        minDiff = diff;
        closestGuess = guess.numericGuess;
        closestGuessId = guess.id;
      }
    });
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-900 to-primary-950 text-white">
      {/* Hidden Navigation Toggle - Click bottom-right corner to reveal */}
      <button
        onClick={() => setShowNavigation(!showNavigation)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-primary-800 bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center z-50 transition-all"
        title="Alternar navegación"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Navigation Panel */}
      {(showNavigation || autoShowNav) && !showFinalResults && (
        <div
          className={`fixed bottom-20 right-4 bg-primary-950 bg-opacity-80 backdrop-blur-sm rounded-xl p-4 z-50 min-w-[200px] transition-all duration-300 ${
            autoShowNav ? "ring-2 ring-secondary-400" : ""
          }`}
        >
          {autoShowNav && (
            <div className="text-xs text-secondary-400 mb-2 font-semibold">
              ✓ Todos los jugadores listos
            </div>
          )}
          <div className="text-sm text-primary-300 mb-2">Navegación</div>
          <button
            onClick={advancePhaseWithAnimation}
            disabled={isAdvancing || isTransitioning}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:text-primary-400 text-white py-3 px-4 rounded-lg font-bold transition-colors"
          >
            {isAdvancing
              ? "Procesando..."
              : gameState?.game.currentPhase === "guessing"
                ? "Comenzar apuestas →"
                : gameState?.game.currentPhase === "betting"
                  ? "Revelar respuesta →"
                  : "Siguiente pregunta →"}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-primary-950 bg-opacity-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold">{gameState.game.title}</h1>
          <div className="flex items-center gap-4">
            {currentQuestion && (
              <div className="text-lg text-primary-200">
                {gameState.game.currentPhase === "guessing"
                  ? `${submittedGuesses}/${totalPlayers} adivinaron`
                  : gameState.game.currentPhase === "betting"
                    ? `${submittedBets}/${totalPlayers} apostaron`
                    : ""}
              </div>
            )}
            <div className="text-2xl font-mono bg-primary-100 text-primary-900 px-6 py-2 rounded-lg">
              {phaseLabels[gameState.game.currentPhase]}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Leaderboard Bar */}
      {sortedPlayers.length > 0 && (
        <div className="bg-primary-900 bg-opacity-80 backdrop-blur-sm border-b border-primary-700">
          <div className="max-w-7xl mx-auto px-8 py-2">
            <div className="flex items-center gap-4 overflow-x-auto">
              <div className="text-xs font-bold text-primary-300 whitespace-nowrap">
                TABLA DE POSICIONES:
              </div>
              {sortedPlayers.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg whitespace-nowrap text-sm ${
                    index === 0
                      ? "bg-amber-500 bg-opacity-30 border border-amber-400"
                      : index === 1
                        ? "bg-primary-400 bg-opacity-30 border border-primary-300"
                        : index === 2
                          ? "bg-orange-600 bg-opacity-30 border border-orange-500"
                          : "bg-primary-700 bg-opacity-50"
                  }`}
                >
                  <span className="text-base">
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `${index + 1}.`}
                  </span>
                  <span className="font-medium">{player.displayName}</span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
              {sortedPlayers.length > 10 && (
                <div className="text-xs text-primary-300">
                  +{sortedPlayers.length - 10} más
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div
          key={contentKey}
          className={`phase-content ${isTransitioning ? "phase-content-exit" : "phase-content-active"}`}
        >
          {!currentQuestion ? (
            <div className="text-center py-8">
              {/* Brand Wordmark */}
              <div
                className="brand-gradient-text font-black mb-4 tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
              >
                WITS &amp; WAGERS
              </div>

              {/* Heading - responsive size with clamp */}
              <div
                className="font-bold mb-6"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                ¡Únete ahora!
              </div>

              {/* QR Code - constrained size */}
              {qrCodeUrl && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Código QR para unirse al juego"
                    className="w-40 h-40 max-w-[200px] max-h-[200px] bg-white p-3 rounded-xl"
                  />
                </div>
              )}

              {/* Join Code - responsive size with clamp */}
              <div className="mb-6">
                <div className="text-lg text-primary-200 mb-2">
                  Código del juego:
                </div>
                <div
                  className="font-bold font-mono bg-primary-100 text-primary-900 px-8 py-4 rounded-xl inline-block"
                  style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
                >
                  {gameState.game.joinCode}
                </div>
              </div>

              {/* Player Count - compact */}
              <div className="text-xl text-primary-200 mb-6">
                {gameState.players.length}{" "}
                {gameState.players.length === 1 ? "jugador" : "jugadores"}{" "}
                listos
              </div>

              {/* Start Game Button - responsive */}
              <button
                onClick={advancePhaseWithAnimation}
                disabled={
                  isAdvancing ||
                  isTransitioning ||
                  gameState.questions.length === 0
                }
                className="bg-secondary-600 hover:bg-secondary-500 disabled:bg-primary-800 disabled:text-primary-400 text-white text-2xl font-bold py-4 px-12 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {isAdvancing ? "Iniciando..." : "Iniciar juego"}
              </button>

              {gameState.questions.length === 0 && (
                <div className="text-lg text-amber-300 mt-4">
                  Agrega preguntas en la página del anfitrión para iniciar el
                  juego
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Guessing Phase - Full Screen Question */}
              {gameState.game.currentPhase === "guessing" && (
                <div className="text-center py-20">
                  <div className="text-6xl font-bold mb-8">
                    {currentQuestion.text}
                  </div>
                  {currentQuestion.subText && (
                    <div className="text-3xl text-primary-200 mb-12">
                      {currentQuestion.subText}
                    </div>
                  )}
                  <div className="text-2xl text-primary-300">
                    Los jugadores están enviando sus estimaciones...
                  </div>
                </div>
              )}

              {/* Betting Phase - Show Guesses */}
              {gameState.game.currentPhase === "betting" && (
                <div>
                  {/* Question (smaller) */}
                  <div className="text-center mb-12">
                    <div className="text-4xl font-bold mb-4">
                      {currentQuestion.text}
                    </div>
                    {currentQuestion.subText && (
                      <div className="text-2xl text-primary-200">
                        {currentQuestion.subText}
                      </div>
                    )}
                  </div>

                  {/* Guesses */}
                  <div className="mb-8">
                    <div className="text-3xl font-bold text-center mb-8">
                      ¡Hagan sus apuestas!
                    </div>
                    <div
                      className={`grid ${gridConfig.cols} ${gridConfig.gap} ${gridConfig.maxWidth} mx-auto`}
                    >
                      {/* Zero option */}
                      <div
                        className={`bg-primary-100 backdrop-blur-sm ${gridConfig.padding} rounded-xl text-center border-4 border-primary-400`}
                      >
                        <div
                          className={`${gridConfig.numberSize} font-bold mb-3 text-primary-900`}
                        >
                          0
                        </div>
                        <div
                          className={`${gridConfig.nameSize} text-primary-700`}
                        >
                          Siempre disponible
                        </div>
                      </div>

                      {/* Player guesses */}
                      {currentGuesses.map((guess) => (
                        <div
                          key={guess.id}
                          className={`bg-primary-50 backdrop-blur-sm ${gridConfig.padding} rounded-xl text-center border-4 border-primary-500`}
                        >
                          <div
                            className={`font-bold mb-3 text-primary-900 ${gridConfig.numberSize}`}
                            style={getResponsiveTextStyle(guess.numericGuess)}
                          >
                            {formatNumber(
                              guess.numericGuess,
                              currentQuestion.answerFormat,
                              {
                                roundCurrency:
                                  currentQuestion.roundCurrency ?? true,
                              },
                            )}
                          </div>
                          <div
                            className={`${gridConfig.nameSize} text-primary-700`}
                          >
                            {guess.playerName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-2xl text-primary-300 text-center">
                    Los jugadores están realizando sus apuestas...
                  </div>
                </div>
              )}

              {/* Reveal Phase - Show Answer and Winners */}
              {gameState.game.currentPhase === "reveal" && (
                <>
                  {showFinalResults ? (
                    <FinalResultsScreen
                      players={sortedPlayers}
                      gameId={gameId}
                    />
                  ) : (
                    <div>
                      {/* Question (smaller) */}
                      <div className="text-center mb-12">
                        <div className="text-4xl font-bold mb-4">
                          {currentQuestion.text}
                        </div>
                        {currentQuestion.subText && (
                          <div className="text-2xl text-primary-200">
                            {currentQuestion.subText}
                          </div>
                        )}
                      </div>

                      {/* Correct Answer */}
                      <div className="text-center mb-12">
                        <div className="text-2xl text-secondary-300 mb-4">
                          Respuesta correcta
                        </div>
                        <div
                          className="font-bold text-secondary-400 mb-8"
                          style={getResponsiveTextStyle(
                            parseFloat(currentQuestion.correctAnswer),
                          )}
                        >
                          {formatNumber(
                            parseFloat(currentQuestion.correctAnswer),
                            currentQuestion.answerFormat,
                            {
                              roundCurrency:
                                currentQuestion.roundCurrency ?? true,
                            },
                          )}
                        </div>
                        {currentQuestion.followUpNotes && (
                          <div className="bg-primary-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl max-w-4xl mx-auto">
                            <p className="text-2xl text-primary-100">
                              {currentQuestion.followUpNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Guesses with Winner Highlighted */}
                      {currentGuesses.length > 0 && (
                        <div className="mb-12">
                          <div className="text-3xl font-bold text-center mb-8">
                            Todas las estimaciones
                          </div>
                          <div
                            className={`grid ${gridConfig.cols} ${gridConfig.gap} ${gridConfig.maxWidth} mx-auto`}
                          >
                            {currentGuesses.map((guess) => (
                              <div
                                key={guess.id}
                                className={`${gridConfig.padding} rounded-xl text-center border-4 ${
                                  guess.id === closestGuessId
                                    ? "bg-secondary-500 bg-opacity-30 border-secondary-400 scale-105"
                                    : "bg-primary-50 border-primary-300"
                                }`}
                              >
                                {guess.id === closestGuessId && (
                                  <div
                                    className={`${gridConfig.nameSize} text-secondary-300 mb-2`}
                                  >
                                    ⭐ GANADOR ⭐
                                  </div>
                                )}
                                <div
                                  className={`font-bold mb-2 ${gridConfig.numberSize} ${
                                    guess.id === closestGuessId
                                      ? "text-white"
                                      : "text-primary-900"
                                  }`}
                                  style={getResponsiveTextStyle(
                                    guess.numericGuess,
                                  )}
                                >
                                  {formatNumber(
                                    guess.numericGuess,
                                    currentQuestion.answerFormat,
                                    {
                                      roundCurrency:
                                        currentQuestion.roundCurrency ?? true,
                                    },
                                  )}
                                </div>
                                <div
                                  className={`${gridConfig.nameSize} ${
                                    guess.id === closestGuessId
                                      ? "text-secondary-200"
                                      : "text-primary-700"
                                  }`}
                                >
                                  {guess.playerName}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
