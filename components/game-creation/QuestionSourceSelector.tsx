"use client";

interface QuestionSourceSelectorProps {
  selectedMode: "manual" | "premade";
  onModeChange: (mode: "manual" | "premade") => void;
  disabled?: boolean;
}

export default function QuestionSourceSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: QuestionSourceSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-primary-200">
        Origen de las preguntas
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          disabled={disabled}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            selectedMode === "manual"
              ? "border-secondary-500 bg-secondary-900/40"
              : "border-primary-600 bg-primary-800 hover:border-primary-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMode === "manual"
                    ? "border-secondary-500"
                    : "border-primary-500"
                }`}
              >
                {selectedMode === "manual" && (
                  <div className="w-3 h-3 rounded-full bg-secondary-500" />
                )}
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">
                Crear preguntas manualmente
              </h3>
              <p className="mt-1 text-sm text-primary-300">
                Agrega tus propias preguntas de trivia personalizadas una por
                una o súbelas desde un archivo
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("premade")}
          disabled={disabled}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            selectedMode === "premade"
              ? "border-secondary-500 bg-secondary-900/40"
              : "border-primary-600 bg-primary-800 hover:border-primary-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMode === "premade"
                    ? "border-secondary-500"
                    : "border-primary-500"
                }`}
              >
                {selectedMode === "premade" && (
                  <div className="w-3 h-3 rounded-full bg-secondary-500" />
                )}
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">
                Usar preguntas predefinidas
              </h3>
              <p className="mt-1 text-sm text-primary-300">
                Explora y selecciona conjuntos de preguntas curados en varias
                categorías
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
