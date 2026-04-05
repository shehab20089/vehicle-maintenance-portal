import { useEffect, useState } from 'react';
import { lookupsApi, type LookupsData } from './api';

let cachedLookups: LookupsData | null = null;

export function useLookups(): { lookups: LookupsData; isLoading: boolean } {
  const [lookups, setLookups] = useState<LookupsData>(cachedLookups ?? {});
  const [isLoading, setIsLoading] = useState(cachedLookups === null);

  useEffect(() => {
    if (cachedLookups) return;

    let cancelled = false;
    lookupsApi.getAll().then((data) => {
      if (!cancelled) {
        cachedLookups = data;
        setLookups(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return { lookups, isLoading };
}
