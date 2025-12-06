'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Point } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { parseGoogleMapsUrl } from '@/lib/utils/parseGoogleMapsUrl';

interface AddPointFormProps {
  groupId: string;
  groupCode: string;
  onSave: (point: Point) => Promise<void>;
}

export function AddPointForm({ groupId, groupCode, onSave }: AddPointFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleMapsUrlChange = (url: string) => {
    setMapsUrl(url);
    const coords = parseGoogleMapsUrl(url);
    if (coords) {
      setLatitude(coords.latitude.toString());
      setLongitude(coords.longitude.toString());
      setError('');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setGettingLocation(false);
        setError('');
      },
      (err) => {
        setGettingLocation(false);
        setError(`Error obteniendo ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
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

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Las coordenadas están fuera de rango');
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const point: Point = {
      id: uuidv4(),
      group_id: groupId,
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: lat,
      longitude: lng,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    try {
      await onSave(point);
      router.push(`/${groupCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando punto');
      setSaving(false);
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
                     focus:ring-blue-500 focus:border-transparent"
          placeholder="Campo Los Alamos"
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
                     focus:ring-blue-500 focus:border-transparent"
          placeholder="20000 lts de agua con bomba"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Ubicación</p>

        <div className="space-y-3">
          <div>
            <label htmlFor="mapsUrl" className="block text-xs text-gray-500 mb-1">
              Pegar link de Google Maps
            </label>
            <input
              type="text"
              id="mapsUrl"
              value={mapsUrl}
              onChange={(e) => handleMapsUrlChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                         focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="https://maps.google.com/maps?q=-33.49,-64.36"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400">o</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg
                       hover:bg-gray-200 transition-colors flex items-center justify-center gap-2
                       disabled:opacity-50"
          >
            {gettingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <span>📍</span> Usar mi ubicación actual
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400">o coordenadas manuales</span>
            <div className="flex-1 border-t border-gray-200"></div>
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
                           focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="-33.4919"
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
                           focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="-64.3672"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
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
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 transition-colors font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
