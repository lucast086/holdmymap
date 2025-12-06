# Plan: HoldMyMap - App para Bomberos Voluntarios

## Resumen
PWA mobile-first para buscar y navegar a puntos rurales usando Google Maps, con funcionamiento offline.

---

## Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Frontend | **Next.js 14 + TypeScript** | SSR, PWA nativo, deploy trivial en Vercel |
| Estilos | **Tailwind CSS** | Mobile-first, rápido de desarrollar |
| Base de datos | **Turso** (SQLite cloud) | Gratis, **NO se pausa**, 9GB storage |
| Offline | **IndexedDB + next-pwa** | Almacenamiento local + Service Worker |
| Hosting | **Vercel** (gratis) | Deploy automático desde GitHub |

---

## Modelo de Datos

```typescript
interface Group {
  id: string;           // UUID
  code: string;         // "BOM-NORTE-2024" (código de acceso)
  name: string;         // "Bomberos Voluntarios Norte"
  created_at: Date;
}

interface Point {
  id: string;
  group_id: string;     // FK a Group
  name: string;         // "Campo Los Alamos"
  description?: string; // "Entrada por tranquera azul"
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
  sync_status: 'synced' | 'pending';  // Para offline
}
```

---

## Estructura del Proyecto

```
holdmymap/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing: input código grupo
│   │   ├── [groupCode]/
│   │   │   ├── page.tsx                # Lista de puntos + búsqueda
│   │   │   ├── add/page.tsx            # Formulario agregar punto
│   │   │   ├── import/page.tsx         # Importar CSV
│   │   │   └── [pointId]/page.tsx      # Editar punto
│   │   └── api/
│   │       ├── groups/route.ts
│   │       └── points/route.ts
│   ├── components/
│   │   ├── PointCard.tsx               # Tarjeta con botón "Ir con Maps"
│   │   ├── PointList.tsx               # Lista con búsqueda
│   │   ├── SearchInput.tsx             # Input búsqueda tiempo real
│   │   ├── AddPointForm.tsx
│   │   ├── CSVImporter.tsx
│   │   └── OfflineIndicator.tsx
│   ├── lib/
│   │   ├── turso.ts                    # Cliente Turso (SQLite)
│   │   ├── db/
│   │   │   ├── indexedDB.ts            # Almacenamiento offline
│   │   │   └── sync.ts                 # Sincronización
│   │   ├── hooks/
│   │   │   ├── usePoints.ts            # Hook offline-first
│   │   │   ├── useOffline.ts
│   │   │   └── useSearch.ts
│   │   └── utils/
│   │       ├── csv.ts                  # Parser CSV
│   │       ├── googleMaps.ts           # Generador links
│   │       └── parseGoogleMapsUrl.ts   # Extrae lat/long de URLs
│   └── types/index.ts
├── public/
│   ├── manifest.json                   # Config PWA
│   └── icons/                          # Iconos app
├── next.config.js                      # Config PWA
└── .env.local                          # Keys Turso (URL + Auth Token)
```

---

## Flujo de Usuario

```
1. INICIO                    2. LISTA DE PUNTOS              3. AGREGAR PUNTO
┌──────────────────┐        ┌──────────────────────┐        ┌──────────────────┐
│ Ingresa código:  │        │ 🔍 Buscar...         │        │ Nombre: [____]   │
│ [BOM-NORTE-2024] │  ──►   │                      │  ──►   │ Desc:   [____]   │
│    [ENTRAR]      │        │ 📍 Campo Los Alamos  │        │ Lat:    [____]   │
│                  │        │   [IR CON MAPS]      │        │ Long:   [____]   │
│ (o entra directo │        │                      │        │ [📍 MI UBICACIÓN]│
│  si ya lo usó)   │        │ 📍 Campo Santa Maria │        │   [GUARDAR]      │
└──────────────────┘        │   [IR CON MAPS]      │        └──────────────────┘
                            │                      │
                            │ [+] Agregar [📄] CSV │
                            │    [Cambiar grupo]   │
                            └──────────────────────┘
```

**Acceso rápido**: URL compartible `holdmymap.vercel.app/CODIGO` (ideal para WhatsApp)

---

## Plan de Implementación

### Fase 1: MVP Online
**Objetivo**: App funcionando básica

1. Setup proyecto Next.js + TypeScript + Tailwind
2. Configurar Turso (crear DB, tablas)
3. Pantalla inicial (input código de grupo)
4. **Recordar grupo**: guardar último código en LocalStorage, entrar directo la próxima vez
5. **URL directa por grupo**: `holdmymap.vercel.app/BOM-NORTE-2024` (compartible por WhatsApp)
6. Lista de puntos con tarjetas
7. Búsqueda en tiempo real (filtrado mientras escribe)
8. Botón "Ir con Maps" (genera URL de navegación)
9. Formulario agregar punto individual
10. Deploy en Vercel

### Fase 2: Importación CSV
**Objetivo**: Migrar datos del Excel actual

1. Parser CSV con papaparse
2. **Parser de URLs de Google Maps** (extraer lat/long de links como `https://maps.google.com/?q=-34.60,-58.38`)
3. UI de importación con drag & drop
4. Preview de datos antes de importar
5. Validación de coordenadas extraídas
6. Edición y eliminación de puntos

> **Nota**: El Excel actual tiene links de Google Maps, no coordenadas directas. El parser debe soportar múltiples formatos de URL de Google Maps.

### Fase 3: PWA + Offline
**Objetivo**: Funciona sin internet

1. Configurar next-pwa
2. Setup IndexedDB con librería `idb`
3. Implementar patrón Repository (offline-first)
4. Cola de sincronización para cambios offline
5. Indicador visual de estado de conexión
6. Manifest.json + iconos para instalación
7. Prompt "Agregar a pantalla de inicio"

### Fase 4: Mejoras (Opcional)
- Geolocalización (usar ubicación actual al agregar punto)
- Ordenar puntos por distancia
- Compartir grupo por QR/link
- Exportar a CSV

---

## Hosting Gratuito

| Servicio | Límites Gratis |
|----------|----------------|
| **Vercel** | 100GB bandwidth/mes, dominio .vercel.app incluido |
| **Turso** | 9GB storage, 500 DBs, **nunca se pausa**, 1B row reads/mes |

**Volumen estimado**: 100-500 puntos en varios grupos. Con 500 puntos (~1KB cada uno), usarían menos de 1MB. El tier gratuito es más que suficiente.

---

## Link Google Maps (código clave)

```typescript
// Genera URL que abre Google Maps en modo navegación
function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
```

---

## Notas de Seguridad

- Sin autenticación compleja (solo código de grupo)
- Cualquiera con el código puede ver Y editar
- Datos no sensibles (coordenadas públicas)
- Simplicidad > Seguridad para este caso de uso

---

## Escalabilidad Futura (no incluido ahora)

**Mapas offline / KMZ**: El modelo de datos actual (lat/long) permite fácilmente:
- Exportar a KMZ para usar con Google Earth, Maps.me, OsmAnd
- Agregar vista de mapa con Leaflet.js + tiles offline

No requiere cambios arquitectónicos, solo agregar features.
