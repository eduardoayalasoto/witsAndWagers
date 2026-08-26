"use client";

import { useState } from "react";

interface Question {
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

interface QuestionCustomizationEditorProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  onBack: () => void;
  onCreateGame: () => void;
  isCreating: boolean;
  error?: string | null;
}

export default function QuestionCustomizationEditor({
  questions,
  onQuestionsChange,
  onBack,
  onCreateGame,
  isCreating,
  error,
}: QuestionCustomizationEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Question | null>(null);

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditForm({ ...question });
  };

  const handleSaveEdit = () => {
    if (!editForm || !editingId) return;

    const updatedQuestions = questions.map((q) =>
      q.id === editingId ? editForm : q,
    );
    onQuestionsChange(updatedQuestions);
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleRemove = (id: string) => {
    const updatedQuestions = questions
      .filter((q) => q.id !== id)
      .map((q, index) => ({ ...q, orderIndex: index }));
    onQuestionsChange(updatedQuestions);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    const reindexed = newQuestions.map((q, i) => ({ ...q, orderIndex: i }));
    onQuestionsChange(reindexed);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    const reindexed = newQuestions.map((q, i) => ({ ...q, orderIndex: i }));
    onQuestionsChange(reindexed);
  };

  const handleAddManual = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: "",
      subText: null,
      correctAnswer: "",
      answerFormat: "plain",
      followUpNotes: null,
      orderIndex: questions.length,
      sourceCategoryName: "Manual",
      roundCurrency: true, // Default to true for new questions
    };
    onQuestionsChange([...questions, newQuestion]);
    handleEdit(newQuestion);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Personalizar preguntas
          </h2>
          <p className="text-primary-300 mt-1">
            Edita, reordena o quita preguntas antes de crear tu juego
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-primary-200 border border-primary-600 rounded-md hover:bg-primary-800"
        >
          ← Volver a la selección
        </button>
      </div>

      <div className="bg-primary-800 border border-primary-600 rounded-lg p-4">
        <p className="text-sm text-primary-100">
          <strong>{questions.length}</strong> pregunta
          {questions.length !== 1 ? "s" : ""} lista
          {questions.length !== 1 ? "s" : ""} para agregar a tu juego
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-primary-800 border-2 border-primary-700 rounded-lg p-4"
          >
            {editingId === question.id && editForm ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Texto de la pregunta *
                  </label>
                  <input
                    type="text"
                    value={editForm.text}
                    onChange={(e) =>
                      setEditForm({ ...editForm, text: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-primary-500 rounded-md bg-white/90 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Escribe el texto de la pregunta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Subtexto (opcional)
                  </label>
                  <input
                    type="text"
                    value={editForm.subText || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        subText: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-primary-500 rounded-md bg-white/90 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Contexto o aclaración adicional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Respuesta correcta *
                    </label>
                    <input
                      type="text"
                      value={editForm.correctAnswer}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          correctAnswer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-primary-500 rounded-md bg-white/90 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      placeholder="Escribe la respuesta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Formato de respuesta
                    </label>
                    <select
                      value={editForm.answerFormat}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          answerFormat: e.target
                            .value as Question["answerFormat"],
                        })
                      }
                      className="w-full px-3 py-2 border border-primary-500 rounded-md bg-white/90 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    >
                      <option value="plain">Número simple</option>
                      <option value="currency">Moneda ($)</option>
                      <option value="date">Fecha (año)</option>
                      <option value="percentage">Porcentaje (%)</option>
                    </select>
                  </div>
                </div>

                {editForm.answerFormat === "currency" && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`roundCurrency-${editForm.id}`}
                      checked={editForm.roundCurrency ?? true}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          roundCurrency: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-primary-400 rounded"
                    />
                    <label
                      htmlFor={`roundCurrency-${editForm.id}`}
                      className="ml-2 block text-sm text-primary-200"
                    >
                      Redondear la moneda a dólares enteros
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={editForm.followUpNotes || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        followUpNotes: e.target.value || null,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-primary-500 rounded-md bg-white/90 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Información adicional para mostrar después de revelar la respuesta"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editForm.text || !editForm.correctAnswer}
                    className="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 disabled:bg-primary-600/50 disabled:cursor-not-allowed"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-primary-200 border border-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-primary-300 hover:text-white disabled:text-primary-600 disabled:cursor-not-allowed"
                    title="Subir"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === questions.length - 1}
                    className="p-1 text-primary-300 hover:text-white disabled:text-primary-600 disabled:cursor-not-allowed"
                    title="Bajar"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {index + 1}.
                        </span>
                        <span className="text-lg font-medium text-white">
                          {question.text}
                        </span>
                      </div>
                      {question.subText && (
                        <p className="text-sm text-primary-300 ml-6">
                          {question.subText}
                        </p>
                      )}
                    </div>
                    {question.sourceCategoryName && (
                      <span className="text-xs bg-primary-700 text-primary-200 px-2 py-1 rounded">
                        {question.sourceCategoryName}
                      </span>
                    )}
                  </div>

                  <div className="ml-6 space-y-1">
                    <p className="text-sm text-primary-200">
                      <span className="font-medium">Respuesta:</span>{" "}
                      {question.correctAnswer}
                      {question.answerFormat === "currency" && " (moneda)"}
                      {question.answerFormat === "date" && " (año)"}
                      {question.answerFormat === "percentage" && " (%)"}
                    </p>
                    {question.followUpNotes && (
                      <p className="text-sm text-primary-300">
                        <span className="font-medium">Notas:</span>{" "}
                        {question.followUpNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(question)}
                    className="px-3 py-1 text-sm text-primary-200 hover:text-white hover:bg-primary-700 rounded-md"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(question.id)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-md"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAddManual}
          className="px-4 py-2 text-primary-200 border-2 border-primary-500 rounded-md hover:bg-primary-800 font-medium"
        >
          + Agregar pregunta manual
        </button>
      </div>

      <div className="border-t border-primary-700 pt-6">
        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onCreateGame}
          disabled={isCreating || questions.length === 0}
          className="w-full py-3 px-4 bg-secondary-700 text-white rounded-lg font-medium text-lg hover:bg-secondary-800 active:bg-secondary-900 disabled:bg-primary-600/50 disabled:cursor-not-allowed"
        >
          {isCreating
            ? "Creando juego..."
            : `Crear juego con ${questions.length} pregunta${questions.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
