'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EditPointForm } from '@/components/EditPointForm';
import { getPointById, savePointLocal, deletePointLocal } from '@/lib/db/indexedDB';
import type { Point } from '@/types';

export default function EditPointPage({
  params,
}: {
  params: Promise<{ groupCode: string; pointId: string }>;
}) {
  const { groupCode, pointId } = use(params);
  const router = useRouter();
  const [point, setPoint] = useState<Point | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPoint() {
      // Cargar desde IndexedDB
      const localPoint = await getPointById(pointId);
      if (localPoint) {
        setPoint(localPoint);
      }
      setLoading(false);
    }
    loadPoint();
  }, [pointId]);

  const handleSave = async (updatedPoint: Point) => {
    await savePointLocal(updatedPoint);

    // Intentar sincronizar
    try {
      const response = await fetch('/api/points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPoint),
      });

      if (response.ok) {
        updatedPoint.sync_status = 'synced';
        await savePointLocal(updatedPoint);
      }
    } catch {
      // Se sincronizará después
    }
  };

  const handleDelete = async (id: string) => {
    await deletePointLocal(id);

    try {
      await fetch(`/api/points?id=${id}`, { method: 'DELETE' });
    } catch {
      // Ignorar errores de red
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!point) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Punto no encontrado</h2>
          <button
            onClick={() => router.push(`/${groupCode}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/${groupCode}`}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="font-bold text-gray-900">Editar punto</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <EditPointForm
          point={point}
          groupCode={groupCode}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
