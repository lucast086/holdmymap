'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PointList } from '@/components/PointList';
import { usePoints } from '@/lib/hooks/usePoints';
import { getGroupByCode, setSetting, saveGroupLocal } from '@/lib/db/indexedDB';
import { fetchAndCacheGroup } from '@/lib/db/sync';
import type { Group } from '@/types';

export default function GroupPage({ params }: { params: Promise<{ groupCode: string }> }) {
  const { groupCode } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Cargar grupo
  useEffect(() => {
    async function loadGroup() {
      setLoadingGroup(true);
      setGroupError(null);

      try {
        // Intentar cargar del servidor
        const serverGroup = await fetchAndCacheGroup(groupCode.toUpperCase());
        if (serverGroup) {
          setGroup(serverGroup);
          await setSetting('lastGroupCode', groupCode.toUpperCase());
        } else {
          // Verificar local
          const localGroup = await getGroupByCode(groupCode.toUpperCase());
          if (localGroup) {
            setGroup(localGroup);
          } else {
            setGroupError('Grupo no encontrado');
          }
        }
      } catch {
        // Modo offline: intentar cargar local
        const localGroup = await getGroupByCode(groupCode.toUpperCase());
        if (localGroup) {
          setGroup(localGroup);
        } else {
          // Crear grupo temporal para modo offline
          const tempGroup: Group = {
            id: `temp-${groupCode.toUpperCase()}`,
            code: groupCode.toUpperCase(),
            name: groupCode.toUpperCase(),
            created_at: new Date().toISOString(),
          };
          await saveGroupLocal(tempGroup);
          setGroup(tempGroup);
        }
      } finally {
        setLoadingGroup(false);
      }
    }

    loadGroup();
  }, [groupCode]);

  const { points, loading, deletePoint, syncing, refresh } = usePoints(group?.id ?? null, groupCode);

  const handleChangeGroup = async () => {
    await setSetting('lastGroupCode', '');
    router.push('/');
  };

  if (loadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E23] mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grupo no encontrado</h2>
          <p className="text-gray-600 mb-4">{groupError}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#6B8E23] text-white rounded-lg hover:bg-[#5C7A1F]"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900">{group?.name || groupCode}</h1>
              <p className="text-xs text-gray-500">{groupCode.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              {syncing && (
                <span className="text-xs text-[#6B8E23] flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-[#6B8E23]"></div>
                  Sincronizando
                </span>
              )}
              <button
                onClick={refresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Actualizar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <PointList
          points={points}
          groupCode={groupCode}
          onDelete={deletePoint}
          loading={loading}
        />
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-safe">
        <div className="max-w-lg mx-auto flex gap-3">
          <Link
            href={`/${groupCode}/add`}
            className="flex-1 py-3 px-4 bg-[#6B8E23] text-white rounded-lg
                       text-center font-medium hover:bg-[#5C7A1F] transition-colors
                       flex items-center justify-center gap-2"
          >
            <span>+</span> Agregar lugar
          </Link>
          <Link
            href={`/${groupCode}/import`}
            className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg
                       font-medium hover:bg-gray-200 transition-colors
                       flex items-center justify-center gap-2"
          >
            <span>📄</span> CSV
          </Link>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleChangeGroup}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cambiar grupo
          </button>
          <a
            href="/manual/"
            target="_blank"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Manual
          </a>
        </div>
      </div>

      {/* Spacer for fixed bottom */}
      <div className="h-36"></div>
    </div>
  );
}
