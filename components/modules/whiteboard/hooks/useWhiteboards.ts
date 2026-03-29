import { useState, useEffect, useCallback } from 'react';
import { Whiteboard, WhiteboardItem } from '../types';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../services/authContext';

const STORAGE_KEY = 'awy_whiteboards';

function loadFromStorage(): Whiteboard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(whiteboards: Whiteboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(whiteboards));
}

async function syncToSupabase(whiteboards: Whiteboard[], userId: string) {
  if (!userId) return;

  // Upsert whiteboards
  const dbBoards = whiteboards.map(w => ({
    id: w.id,
    user_id: userId,
    name: w.name,
    created_at: w.createdAt,
  }));

  if (dbBoards.length > 0) {
    const { error } = await supabase.from('whiteboards').upsert(dbBoards);
    if (error) console.error('Error syncing whiteboards:', error);
  }

  // Upsert all items across all boards
  const dbItems = whiteboards.flatMap(w =>
    w.items.map((item, idx) => ({
      id: item.id,
      whiteboard_id: w.id,
      type: item.type,
      x: item.x,
      y: item.y,
      content: item.type === 'sticky' ? item.content : null,
      module_id: item.type === 'module_ref' ? item.moduleId : null,
      ref_id: item.type === 'module_ref' ? item.refId : null,
      color: item.color ?? null,
      width:  item.type === 'sticky' ? (item.width  ?? null) : null,
      height: item.type === 'sticky' ? (item.height ?? null) : null,
      z_index: idx,
    }))
  );

  if (dbItems.length > 0) {
    const { error } = await supabase.from('whiteboard_items').upsert(dbItems);
    if (error) console.error('Error syncing whiteboard items:', error);
  }
}

function mapDbItemToItem(item: any): WhiteboardItem | null {
  if (item.type === 'sticky') {
    return {
      id: item.id,
      type: 'sticky',
      x: item.x,
      y: item.y,
      color: item.color || 'yellow',
      content: item.content || '',
      width:  item.width  ?? undefined,
      height: item.height ?? undefined,
    };
  }
  if (item.type === 'module_ref') {
    return {
      id: item.id,
      type: 'module_ref',
      x: item.x,
      y: item.y,
      moduleId: item.module_id,
      refId: item.ref_id,
      color: item.color || undefined,
    };
  }
  return null;
}

export function useWhiteboards() {
  const { user } = useAuth();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage immediately for zero-latency
    const local = loadFromStorage();
    setWhiteboards(local);

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Then sync from Supabase
    supabase
      .from('whiteboards')
      .select('*, whiteboard_items(*)')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const remote: Whiteboard[] = data.map((w: any) => ({
            id: w.id,
            name: w.name,
            createdAt: w.created_at,
            items: (w.whiteboard_items || [])
              .sort((a: any, b: any) => (a.z_index ?? 0) - (b.z_index ?? 0))
              .map(mapDbItemToItem)
              .filter(Boolean) as WhiteboardItem[],
          }));
          setWhiteboards(remote);
          saveToStorage(remote);
        }
        setLoading(false);
      });
  }, [user?.uid]);

  const persist = useCallback(
    (updated: Whiteboard[]) => {
      setWhiteboards(updated);
      saveToStorage(updated);
      if (user?.uid) {
        syncToSupabase(updated, user.uid).catch(console.error);
      }
    },
    [user?.uid]
  );

  const createWhiteboard = useCallback(
    (name: string): Whiteboard => {
      const newBoard: Whiteboard = {
        id: `wb_${Date.now()}`,
        name: name.trim() || 'Untitled Board',
        createdAt: new Date().toISOString(),
        items: [],
      };
      persist([...whiteboards, newBoard]);
      return newBoard;
    },
    [whiteboards, persist]
  );

  const deleteWhiteboard = useCallback(
    async (id: string) => {
      persist(whiteboards.filter(w => w.id !== id));
      if (user?.uid) {
        await supabase.from('whiteboard_items').delete().eq('whiteboard_id', id);
        await supabase.from('whiteboards').delete().eq('id', id);
      }
    },
    [whiteboards, persist, user?.uid]
  );

  const renameWhiteboard = useCallback(
    (id: string, name: string) => {
      persist(whiteboards.map(w => (w.id === id ? { ...w, name } : w)));
    },
    [whiteboards, persist]
  );

  const updateItems = useCallback(
    (boardId: string, items: WhiteboardItem[]) => {
      persist(whiteboards.map(w => (w.id === boardId ? { ...w, items } : w)));
    },
    [whiteboards, persist]
  );

  return {
    whiteboards,
    loading,
    createWhiteboard,
    deleteWhiteboard,
    renameWhiteboard,
    updateItems,
  };
}
