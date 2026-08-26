"use client";

import { useState } from "react";

interface AddQuestionButtonProps {
  gameId: string;
  onQuestionAdded: () => void;
  disabled?: boolean;
}

export function AddQuestionButton({
  gameId,
  onQuestionAdded,
  disabled = false,
}: AddQuestionButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState("");
  const [subText, setSubText] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [answerFormat, setAnswerFormat] = useState<
    "plain" | "currency" | "date" | "percentage"
  >("plain");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [roundCurrency, setRoundCurrency] = useState(true); // Default to true
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    setIsAdding(false);
    setText("");
    setSubText("");
    setCorrectAnswer("");
    setAnswerFormat("plain");
    setFollowUpNotes("");
    setRoundCurrency(true); // Reset to default
    setError(null);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      setError("El texto de la pregunta es obligatorio");
      return;
    }

    if (!correctAnswer.trim()) {
      setError("La respuesta correcta es obligatoria");
      return;
    }

    if (isNaN(parseFloat(correctAnswer))) {
      setError("La respuesta correcta debe ser un número");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const questionData = {
        text: text.trim(),
        subText: subText.trim() || undefined,
        correctAnswer: parseFloat(correctAnswer),
        answerFormat,
        followUpNotes: followUpNotes.trim() || undefined,
        roundCurrency, // Include roundCurrency in the request
      };

      console.log("Adding question:", questionData);

      const response = await fetch(`/api/games/${gameId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (!response.ok) {
        throw new Error(data.error?.message || "No se pudo agregar la pregunta");
      }

      handleCancel();
      onQuestionAdded();
    } catch (err) {
      console.error("Error adding question:", err);
      setError(err instanceof Error ? err.message : "No se pudo agregar la pregunta");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        disabled={disabled}
        aria-label="Agregar pregunta"
        className="w-full py-3 px-4 border-2 border-dashed border-primary-500 rounded-md text-primary-200 hover:border-primary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Agregar pregunta
      </button>
    );
  }

  return (
    <div className="border-2 border-primary-600 rounded-lg p-4 bg-primary-900">
      <h3 className="text-lg font-medium text-white mb-4">
        Agregar nueva pregunta
      </h3>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-200 mb-2">
            Texto de la pregunta *
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-2 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white/90"
            placeholder="Ingresa la pregunta"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-200 mb-2">
            Subtexto (opcional)
          </label>
          <input
            type="text"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            className="w-full px-4 py-2 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white/90"
            placeholder="Contexto adicional"
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Respuesta correcta *
            </label>
            <input
              type="number"
              step="any"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full px-4 py-2 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white/90"
              placeholder="Respuesta numérica"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Formato de respuesta
            </label>
            <select
              value={answerFormat}
              onChange={(e) =>
                setAnswerFormat(
                  e.target.value as
                    | "plain"
                    | "currency"
                    | "date"
                    | "percentage",
                )
              }
              className="w-full px-4 py-2 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white/90"
              disabled={saving}
            >
              <option value="plain">Número simple</option>
              <option value="currency">Moneda</option>
              <option value="date">Fecha (año)</option>
              <option value="percentage">Porcentaje</option>
            </select>
          </div>
        </div>

        {answerFormat === "currency" && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="roundCurrency"
              checked={roundCurrency}
              onChange={(e) => setRoundCurrency(e.target.checked)}
              className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-primary-400 rounded"
              disabled={saving}
            />
            <label
              htmlFor="roundCurrency"
              className="ml-2 block text-sm text-primary-200"
            >
              Redondear moneda a dólares enteros
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-primary-200 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            className="w-full px-4 py-2 border border-primary-400 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-transparent bg-white/90"
            placeholder="Datos curiosos para mostrar después de la revelación"
            rows={3}
            disabled={saving}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 active:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Agregando..." : "Agregar pregunta"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 bg-primary-700/40 text-primary-100 rounded-md hover:bg-primary-700/60 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
