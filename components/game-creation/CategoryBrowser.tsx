"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  questionSetCount: number;
}

interface CategoryBrowserProps {
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId: string | null;
}

export default function CategoryBrowser({
  onCategorySelect,
  selectedCategoryId,
}: CategoryBrowserProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/question-sets/categories");
      if (!response.ok) {
        throw new Error("Failed to load categories");
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las categorías",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-300"></div>
          <p className="mt-2 text-sm text-primary-300">
            Cargando categorías...
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
          onClick={fetchCategories}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-primary-900 border border-primary-700 rounded-lg p-6 text-center">
        <p className="text-primary-300">No hay categorías disponibles</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4">
        Selecciona una categoría
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategorySelect(category.id)}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              selectedCategoryId === category.id
                ? "border-secondary-500 bg-secondary-900/40"
                : "border-primary-600 bg-primary-800 hover:border-primary-400"
            }`}
          >
            <h4 className="text-lg font-semibold text-white mb-2">
              {category.name}
            </h4>
            <p className="text-sm text-primary-300">
              {category.questionSetCount} conjunto
              {category.questionSetCount !== 1 ? "s" : ""} de preguntas
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
