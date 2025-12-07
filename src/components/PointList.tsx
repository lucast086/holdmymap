'use client';

import type { Point } from '@/types';
import { PointCard } from './PointCard';
import { SearchInput } from './SearchInput';
import { useSearch } from '@/lib/hooks/useSearch';

interface PointListProps {
  points: Point[];
  groupCode: string;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function PointList({ points, groupCode, onDelete, loading }: PointListProps) {
  const { query, setQuery, filteredPoints } = useSearch(points);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E23]"></div>
        <p className="mt-4 text-gray-500">Cargando puntos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar punto..."
      />

      {filteredPoints.length === 0 ? (
        <div className="text-center py-12">
          {query ? (
            <>
              <p className="text-gray-500">No se encontraron resultados para &quot;{query}&quot;</p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 text-[#6B8E23] hover:underline"
              >
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <p className="text-gray-500">No hay puntos guardados aún</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {filteredPoints.length} {filteredPoints.length === 1 ? 'punto' : 'puntos'}
            {query && ` encontrados`}
          </p>
          {filteredPoints.map((point) => (
            <PointCard
              key={point.id}
              point={point}
              groupCode={groupCode}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
