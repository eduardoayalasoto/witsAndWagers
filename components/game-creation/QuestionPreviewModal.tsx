"use client";

import { useEffect, useState } from "react";

interface Question {
  id: string;
  text: string;
  subText: string | null;
  correctAnswer: string;
  answerFormat: "plain" | "currency" | "date" | "percentage";
  followUpNotes: string | null;
  orderIndex: number;
  roundCurrency?: boolean | null; // Controls currency rounding, null defaults to true
}

interface QuestionPreviewModalProps {
  setId: string;
  setName?: string;
  onClose: () => void;
  onSelect: () => void;
}

export default function QuestionPreviewModal({
  setId,
  setName,
  onClose,
  onSelect,
}: QuestionPreviewModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/question-sets/${setId}/questions`);
      if (!response.ok) {
        throw new Error("Failed to load questions");
      }
      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las preguntas",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnswer = (answer: string, format: string) => {
    switch (format) {
      case "currency":
        return `$${parseFloat(answer).toLocaleString()}`;
      case "percentage":
        return `${answer}%`;
      case "date":
        return answer;
      default:
        return answer;
    }
  };

  const displayedQuestions = showAll ? questions : questions.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-primary-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-primary-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {setName || "Vista previa del conjunto de preguntas"}
              </h2>
              {!isLoading && !error && (
                <p className="mt-1 text-sm text-primary-300">
                  {questions.length} pregunta{questions.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-primary-300 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-300"></div>
                <p className="mt-2 text-sm text-primary-300">
                  Cargando preguntas...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-300 mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchQuestions}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !error && questions.length === 0 && (
            <div className="bg-primary-800 border border-primary-700 rounded-lg p-6 text-center">
              <p className="text-primary-300">No hay preguntas en este conjunto</p>
            </div>
          )}

          {!isLoading && !error && questions.length > 0 && (
            <div className="space-y-6">
              {displayedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 bg-primary-800 rounded-lg border border-primary-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-white mb-1">
                        {question.text}
                      </p>
                      {question.subText && (
                        <p className="text-sm text-primary-300 mb-2">
                          {question.subText}
                        </p>
                      )}
                      <div className="mt-3 p-3 bg-primary-900 rounded border border-primary-600">
                        <p className="text-sm text-primary-300 mb-1">
                          Respuesta:
                        </p>
                        <p className="text-base font-semibold text-white">
                          {formatAnswer(
                            question.correctAnswer,
                            question.answerFormat,
                          )}
                        </p>
                      </div>
                      {question.followUpNotes && (
                        <div className="mt-2 p-2 bg-primary-700/50 rounded text-sm text-primary-100">
                          <span className="font-medium">Nota:</span>{" "}
                          {question.followUpNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {questions.length > 3 && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full py-3 px-4 border-2 border-primary-500 rounded-lg text-primary-200 font-medium hover:border-primary-400 hover:bg-primary-800 transition-colors"
                >
                  Mostrar las {questions.length} preguntas
                </button>
              )}

              {showAll && questions.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="w-full py-3 px-4 border-2 border-primary-500 rounded-lg text-primary-200 font-medium hover:border-primary-400 hover:bg-primary-800 transition-colors"
                >
                  Mostrar menos
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-primary-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-primary-600 rounded-lg text-primary-200 font-medium hover:bg-primary-800 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect();
              onClose();
            }}
            disabled={isLoading || error !== null || questions.length === 0}
            className="flex-1 py-3 px-4 bg-secondary-700 text-white rounded-lg font-medium hover:bg-secondary-800 active:bg-secondary-900 disabled:bg-primary-600/50 disabled:cursor-not-allowed transition-colors"
          >
            Seleccionar este conjunto
          </button>
        </div>
      </div>
    </div>
  );
}
