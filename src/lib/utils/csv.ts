import Papa from 'papaparse';
import { parseGoogleMapsUrl } from './parseGoogleMapsUrl';
import type { Point } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CSVParseResult {
  points: Omit<Point, 'group_id'>[];
  errors: string[];
  skipped: number;
}

interface RawCSVRow {
  Nombre?: string;
  nombre?: string;
  Name?: string;
  name?: string;
  Detalles?: string;
  detalles?: string;
  Description?: string;
  description?: string;
  Ubicacion?: string;
  ubicacion?: string;
  Location?: string;
  location?: string;
  Ubicación?: string;
  [key: string]: string | undefined;
}

export function parseCSV(csvContent: string): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const result: CSVParseResult = {
      points: [],
      errors: [],
      skipped: 0,
    };

    Papa.parse<RawCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult) => {
        parseResult.data.forEach((row, index) => {
          // Buscar campos con diferentes nombres posibles
          const name = row.Nombre || row.nombre || row.Name || row.name || '';
          const description = row.Detalles || row.detalles || row.Description || row.description || '';
          const locationUrl = row.Ubicacion || row.ubicacion || row.Location || row.location || row['Ubicación'] || '';

          if (!name.trim()) {
            result.errors.push(`Fila ${index + 2}: Sin nombre`);
            result.skipped++;
            return;
          }

          if (!locationUrl.trim()) {
            result.errors.push(`Fila ${index + 2}: "${name}" - Sin ubicación`);
            result.skipped++;
            return;
          }

          const coords = parseGoogleMapsUrl(locationUrl);
          if (!coords) {
            result.errors.push(`Fila ${index + 2}: "${name}" - No se pudo extraer coordenadas de: ${locationUrl.substring(0, 50)}...`);
            result.skipped++;
            return;
          }

          const now = new Date().toISOString();
          result.points.push({
            id: uuidv4(),
            name: name.trim(),
            description: description.trim() || undefined,
            latitude: coords.latitude,
            longitude: coords.longitude,
            created_at: now,
            updated_at: now,
            sync_status: 'pending',
          });
        });

        resolve(result);
      },
      error: (error: Error) => {
        result.errors.push(`Error parseando CSV: ${error.message}`);
        resolve(result);
      },
    });
  });
}
