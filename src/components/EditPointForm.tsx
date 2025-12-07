'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Point } from '@/types';
import { parseGoogleMapsUrl } from '@/lib/utils/parseGoogleMapsUrl';

interface EditPointFormProps {
  point: Point;
  groupCode: string;
  onSave: (point: Point) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditPointForm({ point, groupCode, onSave, onDelete }: EditPointFormProps) {
  const router = useRouter();
  const [name, setName] = useState(point.name);
  const [description, setDescription] = useState(point.description || '');
  const [latitude, setLatitude] = useState(point.latitude.toString());
  const [longitude, setLongitude] = useState(point.longitude.toString());
  const [mapsUrl, setMapsUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleMapsUrlChange = (url: string) => {
    setMapsUrl(url);
    const coords = parseGoogleMapsUrl(url);
    if (coords) {
      setLatitude(coords.latitude.toString());
      setLongitude(coords.longitude.toString());
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Las coordenadas no son válidas');
      return;
    }

    setSaving(true);

    const updatedPoint: Point = {
      ...point,
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: lat,
      longitude: lng,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    try {
      await onSave(updatedPoint);
      router.push(`/${groupCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar este punto?')) return;

    setDeleting(true);
    try {
      await onDelete(point.id);
      router.push(`/${groupCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando');
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                     focus:ring-[#6B8E23] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción / Detalles
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                     focus:ring-[#6B8E23] focus:border-transparent"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Ubicación</p>

        <div className="space-y-3">
          <div>
            <label htmlFor="mapsUrl" className="block text-xs text-gray-500 mb-1">
              Actualizar desde link de Google Maps
            </label>
            <input
              type="text"
              id="mapsUrl"
              value={mapsUrl}
              onChange={(e) => handleMapsUrlChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-[#6B8E23] focus:border-transparent text-sm"
              placeholder="https://maps.google.com/maps?q=-33.49,-64.36"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="latitude" className="block text-xs text-gray-500 mb-1">
                Latitud
              </label>
              <input
                type="text"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                           focus:ring-[#6B8E23] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-xs text-gray-500 mb-1">
                Longitud
              </label>
              <input
                type="text"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                           focus:ring-[#6B8E23] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg
                       hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-4 bg-[#6B8E23] text-white rounded-lg
                       hover:bg-[#5C7A1F] transition-colors font-medium
                       disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg
                     hover:bg-red-100 transition-colors font-medium
                     disabled:opacity-50"
        >
          {deleting ? 'Eliminando...' : 'Eliminar punto'}
        </button>
      </div>
    </form>
  );
}
