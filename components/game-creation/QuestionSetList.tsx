"use client";

import { useEffect, useState } from "react";

interface QuestionSet {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
  categoryName: string;
}

interface QuestionSetListProps {
  categoryId: string;
  selectedSetIds: string[];
  onSetSelect: (setId: string) => void;
  onSetDeselect: (setId: string) => void;
  onPreview: (setId: string, setName: string) => void;
  onSetsLoaded?: (sets: QuestionSet[]) => void;
}

export default function QuestionSetList({
  categoryId,
  selectedSetIds,
  onSetSelect,
  onSetDeselect,
  onPreview,
  onSetsLoaded,
}: QuestionSetListProps) {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionSets();
  }, [categoryId]);

  const fetchQuestionSets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/question-sets?categoryId=${categoryId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load question sets");
      }
      const data = await response.json();
      setQuestionSets(data.questionSets);
      if (onSetsLoaded) {
        onSetsLoaded(data.questionSets);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los conjuntos de preguntas",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (setId: string, isChecked: boolean) => {
    if (isChecked) {
      onSetSelect(setId);
    } else {
      onSetDeselect(setId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-300"></div>
          <p className="mt-2 text-sm text-primary-300">
            Cargando conjuntos de preguntas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-300 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchQuestionSets}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (questionSets.length === 0) {
    return (
      <div className="bg-primary-800 border border-primary-700 rounded-lg p-6 text-center">
        <p className="text-primary-300">
          No hay conjuntos de preguntas disponibles en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4">
        Selecciona conjuntos de preguntas
      </h3>
      <div className="space-y-4">
        {questionSets.map((set) => {
          const isSelected = selectedSetIds.includes(set.id);
          return (
            <div
              key={set.id}
              className={`p-4 border-2 rounded-lg transition-all ${
                isSelected
                  ? "border-secondary-500 bg-secondary-900/40"
                  : "border-primary-600 bg-primary-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      handleCheckboxChange(set.id, e.target.checked)
                    }
                    className="w-5 h-5 text-secondary-600 border-primary-400 rounded focus:ring-secondary-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {set.name}
                  </h4>
                  {set.description && (
                    <p className="text-sm text-primary-300 mb-2">
                      {set.description}
                    </p>
                  )}
                  <p className="text-sm text-primary-300">
                    {set.questionCount} pregunta
                    {set.questionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(set.id, set.name)}
                    className="px-4 py-2 text-sm font-medium text-primary-200 hover:text-white hover:bg-primary-700 rounded-md transition-colors"
                  >
                    Vista previa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
