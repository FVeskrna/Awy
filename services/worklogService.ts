
import { supabase } from '../lib/supabase';
import { Worklog } from '../types';

const STORAGE_KEY = 'awy_active_day_logs';

const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

export const worklogService = {
  async getLogs(date: string): Promise<Worklog[]> {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching worklogs:', error);
      // Fallback to localStorage if offline
      const local = localStorage.getItem(`${STORAGE_KEY}_${date}`);
      return local ? JSON.parse(local) : [];
    }

    return data || [];
  },

  async saveLog(log: Partial<Worklog>): Promise<Worklog | null> {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({ ...log, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error saving worklog:', error);
      return null;
    }

    return data;
  },

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting worklog:', error);
  },

  calculateDuration(lastEndTime: string | null, customStartTime?: string | null): number {
    const now = new Date();
    let start: Date;
    
    if (lastEndTime) {
      start = new Date(lastEndTime);
    } else if (customStartTime) {
      // Expecting customStartTime in HH:mm format
      const [hours, minutes] = customStartTime.split(':').map(Number);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0); 
    }
    
    const diff = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60)));
    return diff;
  },

  formatJiraTime(minutes: number): string {
    if (minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();
  },

  saveToLocal(date: string, logs: Worklog[]) {
    localStorage.setItem(`${STORAGE_KEY}_${date}`, JSON.stringify(logs));
  },

  getLocal(date: string): Worklog[] {
    const data = localStorage.getItem(`${STORAGE_KEY}_${date}`);
    return data ? JSON.parse(data) : [];
  }
};
