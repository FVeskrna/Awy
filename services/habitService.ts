
import { Habit, ChecklistData } from '../components/modules/ChecklistModule';

const STORAGE_KEY = 'awy_checklist_data';

import { supabase } from '../lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

export const habitService = {
  async getData(): Promise<ChecklistData> {
    const userId = await getUserId();
    if (!userId) return { lastResetDate: new Date().toISOString().split('T')[0], items: [] };

    // Fetch settings and habits in parallel
    const [settingsRes, habitsRes] = await Promise.all([
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('habits').select('*')
    ]);

    const today = new Date().toISOString().split('T')[0];
    let lastResetDate = settingsRes.data?.checklist_last_reset_date || today;

    let items: Habit[] = (habitsRes.data || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      streak: h.streak,
      completedToday: h.completed_today,
      lastCompletedDate: h.last_completed_date
    }));

    // Check reset logic
    if (lastResetDate !== today) {
      items = items.map(h => ({ ...h, completedToday: false }));
      lastResetDate = today;

      // Update DB asynchronously
      this.saveData({ lastResetDate, items });
    }

    return { lastResetDate, items };
  },

  async saveData(data: ChecklistData): Promise<void> {
    const userId = await getUserId();
    if (!userId) {
      console.warn('habitService.saveData: No user ID');
      return;
    }
    console.log('habitService.saveData: Saving data', data);

    // Save settings
    await supabase.from('user_settings').upsert({
      user_id: userId,
      checklist_last_reset_date: data.lastResetDate
    });

    // Sync habits: Get existing IDs to find deletions
    const { data: existingHabits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId);

    const existingIds = existingHabits?.map((h: any) => h.id) || [];
    const currentIds = data.items.map(h => h.id);

    // Identify IDs that are in DB but not in current state
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) console.error('Error deleting habits:', deleteError);
    }

    // Save habits
    const dbHabits = data.items.map(h => ({
      id: h.id,
      user_id: userId,
      name: h.name,
      streak: h.streak,
      completed_today: h.completedToday,
      last_completed_date: h.lastCompletedDate
    }));

    const { error } = await supabase
      .from('habits')
      .upsert(dbHabits);

    if (error) console.error('Error saving habits:', error);
  }
};
