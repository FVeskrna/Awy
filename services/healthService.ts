
import { supabase } from '../lib/supabase';

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'loading';
  message: string;
  provider: 'GitHub' | 'Cloudflare' | 'AWS' | 'Vercel' | 'OpenAI' | 'Supabase' | 'Netlify' | 'Custom';
}

export interface SystemCheck {
  id?: string;
  user_id?: string;
  name: string;
  type: 'status_page' | 'ping';
  endpoint: string;
  provider?: string;
}

export const healthService = {
  async measureLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch('https://8.8.8.8', { mode: 'no-cors', cache: 'no-cache' });
      return Math.round(performance.now() - start);
    } catch (e) {
      return 999;
    }
  },

  async getPublicIp(): Promise<string> {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  },

  async getChecks(): Promise<SystemCheck[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('system_checks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching system checks:', error);
      return [];
    }

    return data || [];
  },

  async addCheck(check: Omit<SystemCheck, 'id' | 'user_id'>): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase.from('system_checks').insert({
      user_id: session.user.id,
      name: check.name,
      type: check.type,
      endpoint: check.endpoint,
      provider: check.provider
    });

    if (error) console.error('Error adding check:', error);
  },

  async deleteCheck(id: string): Promise<void> {
    const { error } = await supabase.from('system_checks').delete().eq('id', id);
    if (error) console.error('Error deleting check:', error);
  },

  async getGlobalStatus(): Promise<ServiceStatus[]> {
    const checks = await this.getChecks();

    // If no checks defined, return a default set to encourage adding some (or auto-add them?)
    // For now, let's return an empty list or maybe defaults if empty.
    // User requested "choosing from selection". Let's assume if empty, we show nothing or hint?
    // Let's stick to returning what's in DB.

    if (checks.length === 0) {
      // Return defaults strictly for display if user hasn't configured anything yet?
      // Or maybe we should migrate defaults to DB on first load?
      // Let's just return empty and let UI handle "No checks configured".
      return [];
    }

    const statuses: ServiceStatus[] = await Promise.all(checks.map(async (check) => {
      try {
        if (check.type === 'status_page') {
          // Assume Atlassian Statuspage format
          const res = await fetch(check.endpoint).then(r => r.json());
          return {
            name: check.name,
            status: res.status.indicator === 'none' ? 'operational' : 'degraded',
            message: res.status.description || res.page.url,
            provider: (check.provider as any) || 'Custom'
          };
        } else {
          // Ping
          const start = performance.now();
          const pRes = await fetch(check.endpoint, { mode: 'no-cors', cache: 'no-cache' });
          // no-cors returns opaque response. We can't check status code.
          // But if it throws, it's unreachable.
          const latency = Math.round(performance.now() - start);
          return {
            name: check.name,
            status: 'operational',
            message: `Up (${latency}ms) - Reachable`,
            provider: 'Custom'
          };
        }
      } catch (e) {
        return {
          name: check.name,
          status: 'outage',
          message: 'Unreachable or Blocked',
          provider: 'Custom'
        };
      }
    }));

    return statuses;
  }
};
