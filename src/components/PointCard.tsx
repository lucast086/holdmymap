'use client';

import type { Point } from '@/types';
import { generateGoogleMapsUrl } from '@/lib/utils/parseGoogleMapsUrl';
import Link from 'next/link';

interface PointCardProps {
  point: Point;
  groupCode: string;
  onDelete?: (id: string) => void;
}

export function PointCard({ point, groupCode, onDelete }: PointCardProps) {
  const mapsUrl = generateGoogleMapsUrl(point.latitude, point.longitude);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <h3 className="font-semibold text-gray-900 truncate">{point.name}</h3>
            {point.sync_status === 'pending' && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Pendiente
              </span>
            )}
          </div>
          {point.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{point.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#6B8E23] text-white
                       text-sm font-medium rounded-lg hover:bg-[#5C7A1F] active:bg-[#4A6618]
                       transition-colors whitespace-nowrap"
          >
            Go to Maps
          </a>
          <div className="flex gap-1">
            <Link
              href={`/${groupCode}/${point.id}`}
              className="flex-1 text-center px-2 py-1 text-xs text-gray-600 bg-gray-100
                         rounded hover:bg-gray-200 transition-colors"
            >
              Editar
            </Link>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('¿Eliminar este punto?')) {
                    onDelete(point.id);
                  }
                }}
                className="px-2 py-1 text-xs text-red-600 bg-red-50
                           rounded hover:bg-red-100 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
