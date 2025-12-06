import { NextRequest, NextResponse } from 'next/server';
import { turso, initializeDatabase } from '@/lib/turso';
import type { Point } from '@/types';

// POST /api/points/bulk - Importar múltiples puntos
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const { points }: { points: Point[] } = await request.json();

    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json({ error: 'Points array is required' }, { status: 400 });
    }

    let imported = 0;
    let failed = 0;

    for (const point of points) {
      try {
        // Verificar si ya existe
        const existing = await turso.execute({
          sql: 'SELECT id FROM points WHERE id = ?',
          args: [point.id],
        });

        if (existing.rows.length > 0) {
          // Actualizar
          await turso.execute({
            sql: `UPDATE points SET name = ?, description = ?, latitude = ?, longitude = ?, updated_at = ?
                  WHERE id = ?`,
            args: [point.name, point.description || null, point.latitude, point.longitude, point.updated_at, point.id],
          });
        } else {
          // Insertar
          await turso.execute({
            sql: `INSERT INTO points (id, group_id, name, description, latitude, longitude, created_at, updated_at, sync_status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            args: [
              point.id,
              point.group_id,
              point.name,
              point.description || null,
              point.latitude,
              point.longitude,
              point.created_at,
              point.updated_at,
            ],
          });
        }
        imported++;
      } catch (err) {
        console.error('Error importing point:', err);
        failed++;
      }
    }

    return NextResponse.json({ imported, failed, total: points.length });
  } catch (error) {
    console.error('Error bulk importing points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
