import {
  getPendingPoints,
  markPointAsSynced,
  savePointsLocal,
  saveGroupLocal,
  clearPointsByGroup,
} from './indexedDB';
import type { Group, Point } from '@/types';

/**
 * Sincroniza puntos pendientes con el servidor
 */
export async function syncPendingPoints(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingPoints();
  let synced = 0;
  let failed = 0;

  for (const point of pending) {
    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(point),
      });

      if (response.ok) {
        await markPointAsSynced(point.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Descarga todos los puntos de un grupo desde el servidor y los guarda localmente
 */
export async function fetchAndCachePoints(groupCode: string): Promise<Point[]> {
  try {
    const response = await fetch(`/api/points?groupCode=${encodeURIComponent(groupCode)}`);
    if (!response.ok) throw new Error('Failed to fetch points');

    const data = await response.json();
    const points: Point[] = data.points || [];

    if (points.length > 0 && points[0].group_id) {
      // Limpiar puntos existentes y guardar los nuevos
      await clearPointsByGroup(points[0].group_id);
      await savePointsLocal(points);
    }

    return points;
  } catch (error) {
    console.error('Error fetching points:', error);
    throw error;
  }
}

/**
 * Descarga info del grupo y la guarda localmente
 */
export async function fetchAndCacheGroup(code: string): Promise<Group | null> {
  try {
    const response = await fetch(`/api/groups?code=${encodeURIComponent(code)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch group');
    }

    const group: Group = await response.json();
    await saveGroupLocal(group);
    return group;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
}
