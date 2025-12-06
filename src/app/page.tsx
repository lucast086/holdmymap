'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSetting, setSetting } from '@/lib/db/indexedDB';

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    // Verificar si hay un grupo guardado
    async function checkSavedGroup() {
      try {
        const savedCode = await getSetting('lastGroupCode');
        if (savedCode) {
          router.push(`/${savedCode}`);
          return;
        }
      } catch {
        // Ignorar errores de IndexedDB
      }
      setLoading(false);
    }
    checkSavedGroup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Ingresa un código de grupo');
      return;
    }

    setChecking(true);

    try {
      // Verificar si el grupo existe
      const response = await fetch(`/api/groups?code=${encodeURIComponent(trimmedCode)}`);

      if (response.ok) {
        // Grupo existe, guardar y navegar
        await setSetting('lastGroupCode', trimmedCode);
        router.push(`/${trimmedCode}`);
      } else if (response.status === 404) {
        // Grupo no existe, ofrecer crear
        setError(`El grupo "${trimmedCode}" no existe. ¿Deseas crearlo?`);
        setCreateMode(true);
      } else {
        setError('Error verificando grupo');
      }
    } catch {
      // Modo offline o error de red
      await setSetting('lastGroupCode', trimmedCode);
      router.push(`/${trimmedCode}`);
    } finally {
      setChecking(false);
    }
  };

  const handleCreate = async () => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setError('Ingresa un nombre para el grupo');
      return;
    }

    setChecking(true);
    setError('');

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode, name: trimmedName }),
      });

      if (response.ok) {
        await setSetting('lastGroupCode', trimmedCode);
        router.push(`/${trimmedCode}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Error creando grupo');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-gray-900">HoldMyMap</h1>
          <p className="text-gray-600 mt-2">Puntos de agua para bomberos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Código del grupo
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCreateMode(false);
                  setError('');
                }}
                placeholder="BOM-NORTE-2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-center text-lg uppercase tracking-wide"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm ${createMode ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}

            {createMode && (
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Bomberos Voluntarios Norte"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {createMode ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode(false);
                    setError('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg
                             hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={checking}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg
                             hover:bg-green-700 transition-colors font-medium
                             disabled:opacity-50"
                >
                  {checking ? 'Creando...' : 'Crear grupo'}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={checking}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 transition-colors font-medium
                           disabled:opacity-50"
              >
                {checking ? 'Verificando...' : 'Entrar'}
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Comparte el link del grupo por WhatsApp
        </p>
      </div>
    </main>
  );
}
