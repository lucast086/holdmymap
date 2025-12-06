import { createClient, Client, InStatement } from '@libsql/client';

let tursoClient: Client | null = null;

// Cliente Turso - inicialización lazy
function getTurso(): Client {
  if (!tursoClient) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not configured');
    }

    tursoClient = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return tursoClient;
}

// Wrapper para ejecución lazy
export const turso = {
  execute: (stmt: InStatement) => getTurso().execute(stmt),
  batch: (stmts: InStatement[]) => getTurso().batch(stmts),
};

// Inicializar tablas
export async function initializeDatabase() {
  await turso.batch([
    `CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS points (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'synced',
      FOREIGN KEY (group_id) REFERENCES groups(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_points_group ON points(group_id)`,
    `CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code)`,
  ]);
}
