'use client';

import { useState, useMemo } from 'react';
import type { Point } from '@/types';

export function useSearch(points: Point[]) {
  const [query, setQuery] = useState('');

  const filteredPoints = useMemo(() => {
    if (!query.trim()) return points;

    const lowerQuery = query.toLowerCase().trim();
    return points.filter(
      (point) =>
        point.name.toLowerCase().includes(lowerQuery) ||
        point.description?.toLowerCase().includes(lowerQuery)
    );
  }, [points, query]);

  return {
    query,
    setQuery,
    filteredPoints,
  };
}
