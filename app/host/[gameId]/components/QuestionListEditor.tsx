"use client";

import { useState } from "react";
import type { Question } from "@/lib/types/questions";

interface QuestionListEditorProps {
  gameId: string;
  questions: Question[];
  isActive: boolean;
  onQuestionsChange: () => void;
}

export function QuestionListEditor({
  gameId,
  questions,
  isActive,
  onQuestionsChange,
}: QuestionListEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editSubText, setEditSubText] = useState("");
  const [editAnswerFormat, setEditAnswerFormat] = useState<
    "plain" | "currency" | "date" | "percentage"
  >("plain");
  const [editFollowUpNotes, setEditFollowUpNotes] = useState("");
  const [editRoundCurrency, setEditRoundCurrency] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localQuestions, setLocalQuestions] = useState(questions);

  // Update local questions when props change
  useState(() => {
    setLocalQuestions(questions);
  });

  const handleDragStart = (index: number) => {
    if (isActive) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isActive || draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...localQuestions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    setLocalQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    setDraggedIndex(null);

    // Check if order actually changed
    const orderChanged = localQuestions.some(
      (q, i) => q.id !== questions[i]?.id,
    );

    if (!orderChanged) return;

    setSaving(true);
    setError(null);

    try {
      const questionIds = localQuestions.map((q) => q.id);
      const response = await fetch(`/api/games/${gameId}/questions/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudieron reordenar las preguntas");
      }

      onQuestionsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reordenar");
      // Revert to original order on error
      setLocalQuestions(questions);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditText(question.text);
    setEditAnswer(question.correctAnswer);
    setEditSubText(question.subText || "");
    setEditAnswerFormat(question.answerFormat);
    setEditFollowUpNotes(question.followUpNotes || "");
    setEditRoundCurrency(question.roundCurrency ?? true);
    setError(null);
  };

  const handleSave = async (questionId: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/games/${gameId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: editText,
            subText: editSubText || undefined,
            correctAnswer: parseFloat(editAnswer),
            answerFormat: editAnswerFormat,
            followUpNotes: editFollowUpNotes || undefined,
            roundCurrency: editRoundCurrency,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudo actualizar la pregunta");
      }

      setEditingId(null);
      onQuestionsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setError(null);
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/games/${gameId}/questions/${questionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "No se pudo eliminar la pregunta");
      }

      onQuestionsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-primary-300 border-2 border-dashed border-primary-600 rounded-lg">
        <p className="text-lg mb-2">Aún no hay preguntas</p>
        <p className="text-sm">
          Usa el botón "Agregar pregunta" arriba o importa preguntas desde un
          archivo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isActive && (
        <div className="bg-amber-950/40 border border-amber-700 text-amber-300 px-4 py-3 rounded">
          Las preguntas no se pueden editar mientras el juego está activo.
        </div>
      )}

      <div className="space-y-2">
        {localQuestions.map((question, index) => (
          <div
            key={question.id}
            draggable={!isActive && editingId !== question.id}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`border border-primary-700 rounded-lg p-4 bg-primary-900 ${
              !isActive && editingId !== question.id
                ? "cursor-move hover:shadow-md transition-shadow"
                : ""
            } ${draggedIndex === index ? "opacity-50" : ""}`}
          >
            {editingId === question.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Pregunta {index + 1}
                  </label>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-400 rounded-md bg-white/90"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Subtexto (opcional)
                  </label>
                  <input
                    type="text"
                    value={editSubText}
                    onChange={(e) => setEditSubText(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-400 rounded-md bg-white/90"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Respuesta
                    </label>
                    <input
                      type="number"
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full px-3 py-2 border border-primary-400 rounded-md bg-white/90"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Formato
                    </label>
                    <select
                      value={editAnswerFormat}
                      onChange={(e) =>
                        setEditAnswerFormat(
                          e.target.value as
                            | "plain"
                            | "currency"
                            | "date"
                            | "percentage",
                        )
                      }
                      className="w-full px-3 py-2 border border-primary-400 rounded-md bg-white/90"
                      disabled={saving}
                    >
                      <option value="plain">Simple</option>
                      <option value="currency">Moneda</option>
                      <option value="date">Fecha</option>
                      <option value="percentage">Porcentaje</option>
                    </select>
                  </div>
                </div>
                {editAnswerFormat === "currency" && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`editRoundCurrency-${question.id}`}
                      checked={editRoundCurrency}
                      onChange={(e) => setEditRoundCurrency(e.target.checked)}
                      className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-primary-400 rounded"
                      disabled={saving}
                    />
                    <label
                      htmlFor={`editRoundCurrency-${question.id}`}
                      className="ml-2 block text-sm text-primary-200"
                    >
                      Redondear moneda a dólares enteros
                    </label>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={editFollowUpNotes}
                    onChange={(e) => setEditFollowUpNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-primary-400 rounded-md bg-white/90"
                    rows={2}
                    disabled={saving}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(question.id)}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-700/40 text-primary-100 rounded-md hover:bg-primary-700/60 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {index + 1}. {question.text}
                  </div>
                  {question.subText && (
                    <div className="text-sm text-primary-300 mt-1">
                      {question.subText}
                    </div>
                  )}
                  <div className="text-sm text-primary-300 mt-1">
                    Respuesta: {question.correctAnswer}
                    {question.answerFormat === "currency" && " (moneda)"}
                    {question.answerFormat === "date" && " (año)"}
                    {question.answerFormat === "percentage" && " (%)"}
                    {question.answerFormat === "currency" &&
                      question.roundCurrency === false &&
                      " - con centavos"}
                  </div>
                  {question.followUpNotes && (
                    <div className="text-sm text-primary-400 mt-1">
                      Notas: {question.followUpNotes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(question)}
                    disabled={isActive || saving}
                    aria-label={`Editar pregunta ${index + 1}`}
                    className="px-3 py-1 text-sm bg-primary-700/60 text-primary-100 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    disabled={isActive || saving}
                    aria-label={`Eliminar pregunta ${index + 1}`}
                    className="px-3 py-1 text-sm bg-red-900/50 text-red-300 rounded hover:bg-red-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
