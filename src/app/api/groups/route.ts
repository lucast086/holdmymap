import { NextRequest, NextResponse } from 'next/server';
import { turso, initializeDatabase } from '@/lib/turso';
import { v4 as uuidv4 } from 'uuid';

// GET /api/groups?code=XXX - Obtener grupo por código
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const code = request.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const result = await turso.execute({
      sql: 'SELECT * FROM groups WHERE code = ?',
      args: [code.toUpperCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      code: row.code,
      name: row.name,
      created_at: row.created_at,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups - Crear nuevo grupo
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    // Verificar si ya existe
    const existing = await turso.execute({
      sql: 'SELECT id FROM groups WHERE code = ?',
      args: [upperCode],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Group already exists' }, { status: 409 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await turso.execute({
      sql: 'INSERT INTO groups (id, code, name, created_at) VALUES (?, ?, ?, ?)',
      args: [id, upperCode, name.trim(), now],
    });

    return NextResponse.json({
      id,
      code: upperCode,
      name: name.trim(),
      created_at: now,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
