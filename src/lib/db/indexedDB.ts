import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Group, Point } from '@/types';

interface HoldMyMapDB extends DBSchema {
  groups: {
    key: string;
    value: Group;
    indexes: { 'by-code': string };
  };
  points: {
    key: string;
    value: Point;
    indexes: { 'by-group': string; 'by-sync': string };
  };
  settings: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'holdmymap';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HoldMyMapDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HoldMyMapDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HoldMyMapDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Grupos
      if (!db.objectStoreNames.contains('groups')) {
        const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
        groupStore.createIndex('by-code', 'code', { unique: true });
      }

      // Puntos
      if (!db.objectStoreNames.contains('points')) {
        const pointStore = db.createObjectStore('points', { keyPath: 'id' });
        pointStore.createIndex('by-group', 'group_id');
        pointStore.createIndex('by-sync', 'sync_status');
      }

      // Settings (para guardar último grupo, etc)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// === GRUPOS ===

export async function saveGroupLocal(group: Group): Promise<void> {
  const db = await getDB();
  await db.put('groups', group);
}

export async function getGroupByCode(code: string): Promise<Group | undefined> {
  const db = await getDB();
  return db.getFromIndex('groups', 'by-code', code);
}

export async function getAllGroupsLocal(): Promise<Group[]> {
  const db = await getDB();
  return db.getAll('groups');
}

// === PUNTOS ===

export async function savePointLocal(point: Point): Promise<void> {
  const db = await getDB();
  await db.put('points', point);
}

export async function savePointsLocal(points: Point[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('points', 'readwrite');
  await Promise.all([
    ...points.map((p) => tx.store.put(p)),
    tx.done,
  ]);
}

export async function getPointsByGroup(groupId: string): Promise<Point[]> {
  const db = await getDB();
  return db.getAllFromIndex('points', 'by-group', groupId);
}

export async function getPointById(id: string): Promise<Point | undefined> {
  const db = await getDB();
  return db.get('points', id);
}

export async function deletePointLocal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('points', id);
}

export async function getPendingPoints(): Promise<Point[]> {
  const db = await getDB();
  return db.getAllFromIndex('points', 'by-sync', 'pending');
}

export async function markPointAsSynced(id: string): Promise<void> {
  const db = await getDB();
  const point = await db.get('points', id);
  if (point) {
    point.sync_status = 'synced';
    await db.put('points', point);
  }
}

// === SETTINGS ===

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value ?? null;
}

// === SYNC ===

export async function clearPointsByGroup(groupId: string): Promise<void> {
  const db = await getDB();
  const points = await db.getAllFromIndex('points', 'by-group', groupId);
  const tx = db.transaction('points', 'readwrite');
  await Promise.all([
    ...points.map((p) => tx.store.delete(p.id)),
    tx.done,
  ]);
}
