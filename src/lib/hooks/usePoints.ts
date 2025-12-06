'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Point } from '@/types';
import { getPointsByGroup, savePointLocal, deletePointLocal } from '@/lib/db/indexedDB';
import { fetchAndCachePoints, syncPendingPoints } from '@/lib/db/sync';
import { useOffline } from './useOffline';

interface UsePointsResult {
  points: Point[];
  loading: boolean;
  error: string | null;
  addPoint: (point: Point) => Promise<void>;
  updatePoint: (point: Point) => Promise<void>;
  deletePoint: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  syncing: boolean;
}

export function usePoints(groupId: string | null, groupCode: string | null): UsePointsResult {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { isOffline } = useOffline();

  const loadPoints = useCallback(async () => {
    if (!groupId || !groupCode) {
      setPoints([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Modo offline: cargar desde IndexedDB
        const localPoints = await getPointsByGroup(groupId);
        setPoints(localPoints);
      } else {
        // Modo online: sincronizar pendientes y luego cargar del servidor
        setSyncing(true);
        await syncPendingPoints();
        setSyncing(false);

        try {
          const serverPoints = await fetchAndCachePoints(groupCode);
          setPoints(serverPoints);
        } catch {
          // Si falla el servidor, usar datos locales
          const localPoints = await getPointsByGroup(groupId);
          setPoints(localPoints);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando puntos');
    } finally {
      setLoading(false);
    }
  }, [groupId, groupCode, isOffline]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const addPoint = async (point: Point) => {
    // Guardar localmente primero
    await savePointLocal(point);
    setPoints((prev) => [...prev, point]);

    // Si está online, intentar sincronizar
    if (!isOffline) {
      try {
        const response = await fetch('/api/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });

        if (response.ok) {
          const savedPoint = await response.json();
          savedPoint.sync_status = 'synced';
          await savePointLocal(savedPoint);
          setPoints((prev) => prev.map((p) => (p.id === point.id ? savedPoint : p)));
        }
      } catch {
        // Se sincronizará después
      }
    }
  };

  const updatePoint = async (point: Point) => {
    point.updated_at = new Date().toISOString();
    point.sync_status = 'pending';

    await savePointLocal(point);
    setPoints((prev) => prev.map((p) => (p.id === point.id ? point : p)));

    if (!isOffline) {
      try {
        const response = await fetch('/api/points', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });

        if (response.ok) {
          point.sync_status = 'synced';
          await savePointLocal(point);
          setPoints((prev) => prev.map((p) => (p.id === point.id ? point : p)));
        }
      } catch {
        // Se sincronizará después
      }
    }
  };

  const deletePoint = async (id: string) => {
    await deletePointLocal(id);
    setPoints((prev) => prev.filter((p) => p.id !== id));

    if (!isOffline) {
      try {
        await fetch(`/api/points?id=${id}`, { method: 'DELETE' });
      } catch {
        // Ignorar errores de red
      }
    }
  };

  return {
    points,
    loading,
    error,
    addPoint,
    updatePoint,
    deletePoint,
    refresh: loadPoints,
    syncing,
  };
}
