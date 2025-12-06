import { NextRequest, NextResponse } from 'next/server';
import { turso, initializeDatabase } from '@/lib/turso';
import type { Point } from '@/types';

// GET /api/points?groupCode=XXX - Obtener puntos de un grupo
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const groupCode = request.nextUrl.searchParams.get('groupCode');
    if (!groupCode) {
      return NextResponse.json({ error: 'groupCode is required' }, { status: 400 });
    }

    // Primero obtener el group_id
    const groupResult = await turso.execute({
      sql: 'SELECT id FROM groups WHERE code = ?',
      args: [groupCode.toUpperCase()],
    });

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const groupId = groupResult.rows[0].id as string;

    const result = await turso.execute({
      sql: 'SELECT * FROM points WHERE group_id = ? ORDER BY name',
      args: [groupId],
    });

    const points: Point[] = result.rows.map((row) => ({
      id: row.id as string,
      group_id: row.group_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      sync_status: 'synced' as const,
    }));

    return NextResponse.json({ points });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/points - Crear punto
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const point: Point = await request.json();

    if (!point.id || !point.group_id || !point.name || point.latitude === undefined || point.longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verificar si ya existe (para sincronización)
    const existing = await turso.execute({
      sql: 'SELECT id FROM points WHERE id = ?',
      args: [point.id],
    });

    if (existing.rows.length > 0) {
      // Actualizar en lugar de insertar
      await turso.execute({
        sql: `UPDATE points SET name = ?, description = ?, latitude = ?, longitude = ?, updated_at = ?
              WHERE id = ?`,
        args: [point.name, point.description || null, point.latitude, point.longitude, point.updated_at, point.id],
      });
    } else {
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

    return NextResponse.json({ ...point, sync_status: 'synced' }, { status: 201 });
  } catch (error) {
    console.error('Error creating point:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/points/bulk - Importar múltiples puntos
export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();

    const point: Point = await request.json();

    await turso.execute({
      sql: `UPDATE points SET name = ?, description = ?, latitude = ?, longitude = ?, updated_at = ?
            WHERE id = ?`,
      args: [point.name, point.description || null, point.latitude, point.longitude, point.updated_at, point.id],
    });

    return NextResponse.json({ ...point, sync_status: 'synced' });
  } catch (error) {
    console.error('Error updating point:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/points?id=XXX - Eliminar punto
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await turso.execute({
      sql: 'DELETE FROM points WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting point:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
