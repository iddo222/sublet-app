import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Sublet } from './useSublets';

export function useSavedSublets(userId: string | undefined) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedSublets, setSavedSublets] = useState<Sublet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    if (!userId) {
      setSavedIds(new Set());
      setSavedSublets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch saved sublet IDs
    const { data: savedRows } = await supabase
      .from('saved_sublets')
      .select('sublet_id')
      .eq('user_id', userId);

    const ids = new Set((savedRows ?? []).map((r) => r.sublet_id));
    setSavedIds(ids);

    // Fetch full sublet data for the saved IDs
    if (ids.size > 0) {
      const { data: sublets } = await supabase
        .from('sublets')
        .select('*')
        .in('id', Array.from(ids))
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setSavedSublets(sublets ?? []);
    } else {
      setSavedSublets([]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = useCallback(
    (subletId: string) => savedIds.has(subletId),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (subletId: string) => {
      if (!userId) return;

      if (savedIds.has(subletId)) {
        // Unsave
        await supabase
          .from('saved_sublets')
          .delete()
          .eq('user_id', userId)
          .eq('sublet_id', subletId);

        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(subletId);
          return next;
        });
        setSavedSublets((prev) => prev.filter((s) => s.id !== subletId));
      } else {
        // Save
        await supabase
          .from('saved_sublets')
          .insert({ user_id: userId, sublet_id: subletId });

        setSavedIds((prev) => new Set(prev).add(subletId));

        // Fetch the full sublet to add to the list
        const { data } = await supabase
          .from('sublets')
          .select('*')
          .eq('id', subletId)
          .single();

        if (data) {
          setSavedSublets((prev) => [data, ...prev]);
        }
      }
    },
    [userId, savedIds]
  );

  return { savedSublets, savedIds, loading, isSaved, toggleSave, refetch: fetchSaved };
}
