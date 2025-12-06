export interface Group {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface Point {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending';
}

export interface CSVRow {
  name: string;
  description?: string;
  location: string; // URL de Google Maps o coordenadas
}

export type SyncStatus = 'synced' | 'pending' | 'error';
