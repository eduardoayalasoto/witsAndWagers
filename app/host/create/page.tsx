"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionSourceSelector from "@/components/game-creation/QuestionSourceSelector";
import CategoryBrowser from "@/components/game-creation/CategoryBrowser";
import QuestionSetList from "@/components/game-creation/QuestionSetList";
import QuestionPreviewModal from "@/components/game-creation/QuestionPreviewModal";
import SelectedSetsPanel from "@/components/game-creation/SelectedSetsPanel";
import QuestionCustomizationEditor from "@/components/game-creation/QuestionCustomizationEditor";

// TODO: Future enhancement - Add optional logo upload field
// Allow hosts to upload a logo image that will be displayed in the header
// during gameplay (on host dashboard, display view, and player view)

interface SelectedSet {
  id: string;
  name: string;
  categoryName: string;
  questionCount: number;
}

interface LoadedQuestion {
  id: string;
  text: string;
  subText: string | null;
  correctAnswer: string;
  answerFormat: "plain" | "currency" | "date" | "percentage";
  followUpNotes: string | null;
  orderIndex: number;
  sourceCategoryName?: string;
  roundCurrency?: boolean | null; // Controls currency rounding, null defaults to true
}

export default function CreateGamePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question source mode
  const [mode, setMode] = useState<"manual" | "premade">("manual");

  // Pre-made question selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<SelectedSet[]>([]);
  const [previewSetId, setPreviewSetId] = useState<string | null>(null);
  const [previewSetName, setPreviewSetName] = useState<string>("");

  // Customization state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [loadedQuestions, setLoadedQuestions] = useState<LoadedQuestion[]>([]);

  const handleSetSelect = async (setId: string) => {
    if (selectedSetIds.includes(setId)) return;

    // Fetch the question set details to add to selectedSets
    try {
      const response = await fetch(
        `/api/question-sets?categoryId=${selectedCategoryId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch question set details");

      const data = await response.json();
      const set = data.questionSets.find((s: SelectedSet) => s.id === setId);

      if (set) {
        setSelectedSetIds([...selectedSetIds, setId]);
        setSelectedSets([
          ...selectedSets,
          {
            id: set.id,
            name: set.name,
            categoryName: set.categoryName,
            questionCount: set.questionCount,
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo seleccionar el conjunto de preguntas",
      );
    }
  };

  const handleSetDeselect = (setId: string) => {
    setSelectedSetIds(selectedSetIds.filter((id) => id !== setId));
    setSelectedSets(selectedSets.filter((set) => set.id !== setId));
  };

  const handlePreview = (setId: string, setName: string) => {
    setPreviewSetId(setId);
    setPreviewSetName(setName);
  };

  const handleProceedToCustomization = async () => {
    if (!title.trim()) {
      setError("El título del juego es obligatorio");
      return;
    }

    if (selectedSetIds.length === 0) {
      setError("Selecciona al menos un conjunto de preguntas");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Fetch all questions from selected sets
      const allQuestions: LoadedQuestion[] = [];
      for (const setId of selectedSetIds) {
        const response = await fetch(`/api/question-sets/${setId}/questions`);
        if (!response.ok) throw new Error("No se pudieron cargar las preguntas");
        const data = await response.json();

        // Find the category name for this set
        const set = selectedSets.find((s) => s.id === setId);
        const categoryName = set?.categoryName || "Desconocida";

        // Add questions with source category
        const questionsWithSource = data.questions.map(
          (q: LoadedQuestion, index: number) => ({
            ...q,
            id: `${setId}-${q.id}`,
            orderIndex: allQuestions.length + index,
            sourceCategoryName: categoryName,
          }),
        );

        allQuestions.push(...questionsWithSource);
      }

      setLoadedQuestions(allQuestions);
      setIsCustomizing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las preguntas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSelection = () => {
    setIsCustomizing(false);
    setLoadedQuestions([]);
  };

  const handleCreateGameWithQuestions = async () => {
    if (!title.trim()) {
      setError("El título del juego es obligatorio");
      return;
    }

    if (loadedQuestions.length === 0) {
      setError("Se requiere al menos una pregunta");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Creating game with questions:", {
        title,
        questionCount: loadedQuestions.length,
      });

      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          questions: loadedQuestions.map((q, index) => ({
            text: q.text,
            subText: q.subText,
            correctAnswer: q.correctAnswer,
            answerFormat: q.answerFormat,
            followUpNotes: q.followUpNotes,
            orderIndex: index,
          })),
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("Error response:", data);
        throw new Error(data.error?.message || "No se pudo crear el juego");
      }

      const data = await response.json();
      console.log("Game created successfully:", data);
      console.log("Attempting to navigate to:", `/host/${data.gameId}`);

      // Use window.location as a fallback if router.push doesn't work
      window.location.href = `/host/${data.gameId}`;
    } catch (err) {
      console.error("Error creating game:", err);
      setError(err instanceof Error ? err.message : "No se pudo crear el juego");
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("El título del juego es obligatorio");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          questions: [], // Create game without questions initially
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudo crear el juego");
      }

      const data = await response.json();
      router.push(`/host/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el juego");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-primary-800 p-8 rounded-lg shadow-xl border border-primary-700">
          {isCustomizing ? (
            // Customization Editor View
            <QuestionCustomizationEditor
              questions={loadedQuestions}
              onQuestionsChange={setLoadedQuestions}
              onBack={handleBackToSelection}
              onCreateGame={handleCreateGameWithQuestions}
              isCreating={isSubmitting}
              error={error}
            />
          ) : (
            // Selection View
            <>
              <h1 className="text-3xl font-bold text-white mb-2">
                Crear nuevo juego
              </h1>
              <p className="text-primary-200 mb-8">
                {mode === "manual"
                  ? "Ingresa un título para tu juego. Agregarás las preguntas en la siguiente página."
                  : "Selecciona conjuntos de preguntas predefinidos para crear tu juego rápidamente."}
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-2">
                    Título del juego
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-lg bg-white/90"
                    placeholder="p. ej., Noche de trivia en equipo"
                    autoFocus
                  />
                </div>

                <QuestionSourceSelector
                  selectedMode={mode}
                  onModeChange={setMode}
                  disabled={isSubmitting}
                />

                {mode === "premade" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <CategoryBrowser
                        onCategorySelect={setSelectedCategoryId}
                        selectedCategoryId={selectedCategoryId}
                      />

                      {selectedCategoryId && (
                        <QuestionSetList
                          categoryId={selectedCategoryId}
                          selectedSetIds={selectedSetIds}
                          onSetSelect={handleSetSelect}
                          onSetDeselect={handleSetDeselect}
                          onPreview={handlePreview}
                        />
                      )}
                    </div>

                    <div>
                      <SelectedSetsPanel
                        selectedSets={selectedSets}
                        onRemoveSet={handleSetDeselect}
                        onProceedToCustomization={handleProceedToCustomization}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {mode === "manual" && (
                  <>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-700 text-white py-3 px-4 rounded-md hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {isSubmitting ? "Creando juego..." : "Crear juego"}
                    </button>

                    <div className="mt-8 p-4 bg-primary-900 border border-primary-700 rounded-md">
                      <h3 className="text-sm font-medium text-primary-100 mb-2">
                        ¿Qué sigue?
                      </h3>
                      <ul className="text-sm text-primary-200 space-y-1">
                        <li>• Sube preguntas desde un archivo CSV o JSON</li>
                        <li>• O agrega preguntas manualmente una por una</li>
                        <li>• Edita, reordena o elimina preguntas en cualquier momento</li>
                        <li>• Inicia el juego cuando estés listo</li>
                      </ul>
                    </div>
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      {previewSetId && (
        <QuestionPreviewModal
          setId={previewSetId}
          setName={previewSetName}
          onClose={() => setPreviewSetId(null)}
          onSelect={() => handleSetSelect(previewSetId)}
        />
      )}
    </div>
  );
}
