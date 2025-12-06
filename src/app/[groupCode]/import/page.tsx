'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CSVImporter } from '@/components/CSVImporter';
import { getGroupByCode, savePointsLocal } from '@/lib/db/indexedDB';
import { fetchAndCacheGroup } from '@/lib/db/sync';
import type { Group, Point } from '@/types';

export default function ImportPage({ params }: { params: Promise<{ groupCode: string }> }) {
  const { groupCode } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroup() {
      try {
        const serverGroup = await fetchAndCacheGroup(groupCode.toUpperCase());
        if (serverGroup) {
          setGroup(serverGroup);
        } else {
          const localGroup = await getGroupByCode(groupCode.toUpperCase());
          setGroup(localGroup || null);
        }
      } catch {
        const localGroup = await getGroupByCode(groupCode.toUpperCase());
        setGroup(localGroup || null);
      } finally {
        setLoading(false);
      }
    }
    loadGroup();
  }, [groupCode]);

  const handleImport = async (points: Point[]) => {
    // Guardar localmente primero
    await savePointsLocal(points);

    // Intentar sincronizar con el servidor
    try {
      const response = await fetch('/api/points/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });

      if (response.ok) {
        // Marcar como sincronizados
        const syncedPoints = points.map((p) => ({ ...p, sync_status: 'synced' as const }));
        await savePointsLocal(syncedPoints);
      }
    } catch {
      // Se sincronizará después
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Grupo no encontrado</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
            Volver al inicio
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
            <h1 className="font-bold text-gray-900">Importar CSV</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <CSVImporter
          groupId={group.id}
          groupCode={groupCode}
          onImport={handleImport}
        />
      </main>
    </div>
  );
}
