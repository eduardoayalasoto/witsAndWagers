"use client";

interface SelectedSet {
  id: string;
  name: string;
  categoryName: string;
  questionCount: number;
}

interface SelectedSetsPanelProps {
  selectedSets: SelectedSet[];
  onRemoveSet: (setId: string) => void;
  onProceedToCustomization: () => void;
}

export default function SelectedSetsPanel({
  selectedSets,
  onRemoveSet,
  onProceedToCustomization,
}: SelectedSetsPanelProps) {
  const totalQuestions = selectedSets.reduce(
    (sum, set) => sum + set.questionCount,
    0,
  );

  if (selectedSets.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-4 bg-primary-900 border-2 border-secondary-600 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4">
        Conjuntos de preguntas seleccionados
      </h3>

      <div className="space-y-3 mb-4">
        {selectedSets.map((set) => (
          <div
            key={set.id}
            className="flex items-start justify-between gap-3 p-3 bg-secondary-900/40 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{set.name}</p>
              <p className="text-sm text-primary-300">
                {set.categoryName} • {set.questionCount} pregunta
                {set.questionCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemoveSet(set.id)}
              className="flex-shrink-0 text-red-400 hover:text-red-300 text-xl leading-none"
              aria-label="Quitar conjunto"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-primary-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-primary-200">
            Total de preguntas:
          </span>
          <span className="text-lg font-bold text-secondary-400">
            {totalQuestions}
          </span>
        </div>

        <button
          type="button"
          onClick={onProceedToCustomization}
          disabled={selectedSets.length === 0}
          className="w-full py-3 px-4 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 active:bg-primary-900 disabled:bg-primary-600/50 disabled:cursor-not-allowed transition-colors"
        >
          Personalizar y crear juego
        </button>
      </div>
    </div>
  );
}
