
import { supabase } from '../lib/supabase';
import { DashboardWidget, DashboardLayout } from '../types';

const STORAGE_KEY = 'awy_dashboard_layout';

export const dashboardService = {
  async getLayout(userId: string): Promise<DashboardWidget[]> {
    try {
      // 1. Try Supabase
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout_json')
        .eq('user_id', userId)
        .single();

      if (data && data.layout_json) {
        return data.layout_json as DashboardWidget[];
      }

      // 2. Fallback to LocalStorage
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch (err) {
      console.warn('dashboardService: Failed to fetch layout, using default', err);
    }

    return this.getDefaultLayout();
  },

  async saveLayout(userId: string, widgets: DashboardWidget[]) {
    // 1. Save locally for zero-latency
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));

    // 2. Sync to Supabase
    try {
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({ 
          user_id: userId, 
          layout_json: widgets,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('dashboardService: Failed to sync layout to cloud', err);
    }
  },

  getDefaultLayout(): DashboardWidget[] {
    return [
      { id: 'tasks-1', moduleId: 'tasks', x: 0, y: 0, w: 2, h: 2 },
      { id: 'worklog-1', moduleId: 'worklog', x: 2, y: 0, w: 1, h: 1 },
      { id: 'mentalload-1', moduleId: 'mentalload', x: 2, y: 1, w: 1, h: 1 }
    ];
  }
};
