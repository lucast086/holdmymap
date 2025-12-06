'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseCSV } from '@/lib/utils/csv';
import type { Point } from '@/types';

interface CSVImporterProps {
  groupId: string;
  groupCode: string;
  onImport: (points: Point[]) => Promise<void>;
}

export function CSVImporter({ groupId, groupCode, onImport }: CSVImporterProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Omit<Point, 'group_id'>[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setErrors([]);

    const text = await f.text();
    const result = await parseCSV(text);

    setPreview(result.points);
    setErrors(result.errors);
    setSkipped(result.skipped);
    setParsing(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      processFile(f);
    }
  }, [processFile]);

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;

    setImporting(true);

    const pointsWithGroup: Point[] = preview.map((p) => ({
      ...p,
      group_id: groupId,
    }));

    try {
      await onImport(pointsWithGroup);
      router.push(`/${groupCode}`);
    } catch (err) {
      setErrors((prev) => [...prev, err instanceof Error ? err.message : 'Error importando']);
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    setSkipped(0);
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                       ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-600 mb-4">
              Arrastra un archivo CSV aquí o
            </p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                              transition-colors inline-block">
                Seleccionar archivo
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Formato esperado del CSV:</p>
            <code className="block bg-white p-2 rounded border text-xs overflow-x-auto">
              Nombre,Detalles,Ubicacion<br />
              Campo Los Alamos,20000 lts agua,https://maps.google.com/maps?q=-33.49,-64.36
            </code>
            <p className="mt-2 text-xs text-gray-500">
              La columna Ubicacion puede ser un link de Google Maps o coordenadas directas.
            </p>
          </div>
        </>
      ) : (
        <>
          {parsing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Procesando CSV...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Vista previa</h3>
                    <p className="text-sm text-gray-500">
                      {preview.length} puntos listos para importar
                      {skipped > 0 && (
                        <span className="text-yellow-600 ml-2">
                          ({skipped} omitidos)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {errors.length > 0 && (
                  <div className="mb-4 bg-yellow-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Advertencias:
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {errors.slice(0, 10).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                      {errors.length > 10 && (
                        <li>... y {errors.length - 10} más</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {preview.slice(0, 20).map((point, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-400">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{point.name}</p>
                        <p className="text-xs text-gray-500">
                          {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {preview.length > 20 && (
                    <p className="text-center text-sm text-gray-500 py-2">
                      ... y {preview.length - 20} más
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg
                             hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || preview.length === 0}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 transition-colors font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importando...' : `Importar ${preview.length} puntos`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
