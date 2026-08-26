"use client";

import { useState, useRef } from "react";

interface FileUploadButtonProps {
  gameId: string;
  onImportComplete: (count: number) => void;
  disabled: boolean;
}

export function FileUploadButton({
  gameId,
  onImportComplete,
  disabled,
}: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/games/${gameId}/questions/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.details && Array.isArray(data.error.details)) {
          // Format validation errors with better structure
          const errorMessages = data.error.details
            .map((err: any) => {
              if (err.index !== undefined && err.errors) {
                // Batch validation errors
                const fieldErrors = err.errors
                  .map((e: any) => `  • ${e.field}: ${e.message}`)
                  .join("\n");
                return `Pregunta ${err.index + 1}:\n${fieldErrors}`;
              } else if (err.field && err.message) {
                // Parse errors
                return `${err.message}`;
              }
              return err.message || "Error desconocido";
            })
            .join("\n\n");

          const errorHeader =
            data.error.details.length === 1
              ? "Se encontró un error:"
              : `Se encontraron ${data.error.details.length} errores:`;

          throw new Error(`${errorHeader}\n\n${errorMessages}`);
        }
        throw new Error(data.error?.message || "No se pudieron importar las preguntas");
      }

      setSuccess(`Se importaron ${data.imported} preguntas correctamente`);
      onImportComplete(data.imported);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          aria-label="Importar preguntas desde un archivo CSV o JSON"
          className={`inline-block px-4 py-2 rounded-md cursor-pointer ${
            disabled || uploading
              ? "bg-primary-700/40 text-primary-400 cursor-not-allowed"
              : "bg-primary-700 text-white hover:bg-primary-800"
          }`}
        >
          {uploading ? "Subiendo..." : "Importar preguntas (CSV/JSON)"}
        </label>
      </div>

      {/* Format help text */}
      <div className="text-xs text-primary-300">
        <details className="cursor-pointer">
          <summary className="hover:text-primary-100">Ayuda sobre el formato CSV</summary>
          <div className="mt-2 p-2 bg-primary-900 rounded border border-primary-700">
            <p className="mb-1">Columnas obligatorias:</p>
            <ul className="list-disc list-inside ml-2 mb-2">
              <li>
                <code className="bg-primary-800 px-1 rounded">text</code> - El
                texto de la pregunta
              </li>
              <li>
                <code className="bg-primary-800 px-1 rounded">correctAnswer</code>{" "}
                - Un número
              </li>
            </ul>
            <p className="mb-1">Columnas opcionales:</p>
            <ul className="list-disc list-inside ml-2">
              <li>
                <code className="bg-primary-800 px-1 rounded">subText</code> -
                Contexto adicional
              </li>
              <li>
                <code className="bg-primary-800 px-1 rounded">answerFormat</code> -
                plain, currency, date o percentage
              </li>
              <li>
                <code className="bg-primary-800 px-1 rounded">followUpNotes</code>{" "}
                - Datos curiosos para mostrar después de la revelación
              </li>
            </ul>
          </div>
        </details>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded text-sm whitespace-pre-line max-h-60 overflow-y-auto">
          <div className="font-semibold mb-1">Error al importar</div>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-secondary-900/40 border border-secondary-700 text-secondary-200 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
