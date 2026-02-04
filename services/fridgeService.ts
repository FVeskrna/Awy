import { Snippet } from '../types';

const STORAGE_KEY = 'awy_fridge_snippets';

import { supabase } from '../lib/supabase';



export const fridgeService = {
  async getAll(): Promise<Snippet[]> {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching snippets:', error);
      return [];
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      language: s.language,
      tag: s.tag,
      updatedAt: Number(s.updated_at)
    }));
  },

  async saveAll(snippets: Snippet[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.warn('fridgeService.saveAll: No active session/user ID - Cannot persist snippets!');
      // Optional: Could throw error or just return, depending on desired UX. 
      // Given user requirements, protecting against null is key.
      return;
    }

    // Sync: fetch existing IDs to detect deletions
    const { data: existingSnippets } = await supabase
      .from('snippets')
      .select('id')
      .eq('user_id', userId);

    const existingIds = existingSnippets?.map((s: any) => s.id) || [];
    const currentIds = snippets.map(s => s.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('snippets')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) console.error('Error deleting snippets:', deleteError);
    }

    const dbSnippets = snippets.map(s => ({
      id: s.id,
      user_id: userId,
      title: s.title,
      content: s.content,
      language: s.language,
      tag: s.tag,
      updated_at: s.updatedAt
    }));

    const { error } = await supabase
      .from('snippets')
      .upsert(dbSnippets);

    if (error) console.error('Error saving snippets:', error);
  },

  createSnippet(title: string, content: string, language: string, tag: string): Snippet {
    return {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      language,
      tag,
      updatedAt: Date.now()
    };
  }
};