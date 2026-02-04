
import { LoadEntry } from '../types';

const STORAGE_KEY = 'awy_mental_load_data';

import { supabase } from '../lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

export const mentalLoadService = {
  async getEntries(): Promise<LoadEntry[]> {
    const { data, error } = await supabase
      .from('load_entries')
      .select('*')
      .order('timestamp', { ascending: true }); // Chronological order

    if (error) {
      if (error.message?.includes('AbortError') || error.details?.includes('AbortError')) {
        return [];
      }
      console.error('Error fetching load entries:', error);
      return [];
    }

    return (data || []).map((e: any) => ({
      level: e.level,
      note: e.note,
      chips: e.chips || [],
      timestamp: Number(e.timestamp)
    }));
  },

  async logEntry(entry: LoadEntry): Promise<void> {
    const userId = await getUserId();
    if (!userId) return;

    // Insert new entry
    const { error } = await supabase
      .from('load_entries')
      .insert({
        user_id: userId,
        level: entry.level,
        note: entry.note,
        chips: entry.chips,
        timestamp: entry.timestamp
      });

    if (error) console.error('Error logging mental load:', error);
  },

  async clearHistory(): Promise<void> {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from('load_entries')
      .delete()
      .eq('user_id', userId); // Ensure we only delete user's data

    if (error) console.error('Error clearing history:', error);
  },

  calculateInsights(entries: LoadEntry[]): string[] {
    if (entries.length < 5) return ["Log more data to reveal energy patterns."];
    const messages: string[] = [];
    const afternoonDip = entries.filter(e => {
      const h = new Date(e.timestamp).getHours();
      return h >= 14 && h <= 16 && e.level < 3;
    });
    if (afternoonDip.length >= 2) messages.push("Pattern: Capacity dips daily @ 2-4 PM. Use for shallow work.");

    const fatigueWithTags = entries.filter(e => e.level < 3 && e.chips.length > 0);
    if (fatigueWithTags.length > 3) messages.push("Correlation identified: Specific tags linked to reduced cognitive reserve.");

    return messages.length > 0 ? messages : ["Systems stable. Optimal for deep focus tasks."];
  }
};
