
import { MeetingLocation } from '../types';

const STORAGE_KEY = 'awy_meeting_navigator_locs';

const INITIAL_LOCATIONS: MeetingLocation[] = [
  { id: 'nyc', label: 'New York', timezone: 'America/New_York', workStart: 9, workEnd: 17, isPrimary: true },
  { id: 'london', label: 'London', timezone: 'Europe/London', workStart: 9, workEnd: 17, isPrimary: true },
  { id: 'prague', label: 'Prague', timezone: 'Europe/Prague', workStart: 9, workEnd: 17, isPrimary: true },
];

import { supabase } from '../lib/supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

export const meetingService = {
  async getLocations(): Promise<MeetingLocation[]> {
    const { data, error } = await supabase
      .from('meeting_locations')
      .select('*');

    if (error) {
      console.error('Error fetching meeting locations:', error);
      return INITIAL_LOCATIONS;
    }

    // If user has no locations saved, return initial? 
    // Or we should initialize them in DB. 
    // For now, if empty, return initial to match old behavior logic if possible.
    // The old behavior was: if (!saved) return INITIAL_LOCATIONS.

    if (!data || data.length === 0) return INITIAL_LOCATIONS;

    return data.map((l: any) => ({
      id: l.id,
      label: l.label,
      timezone: l.timezone,
      workStart: Number(l.work_start),
      workEnd: Number(l.work_end),
      isPrimary: l.is_primary
    }));
  },

  async saveLocations(locations: MeetingLocation[]): Promise<void> {
    const userId = await getUserId();
    if (!userId) return;

    const dbLocations = locations.map(l => ({
      id: l.id,
      user_id: userId,
      label: l.label,
      timezone: l.timezone,
      work_start: l.workStart,
      work_end: l.workEnd,
      is_primary: l.isPrimary
    }));

    const { error } = await supabase
      .from('meeting_locations')
      .upsert(dbLocations);

    if (error) console.error('Error saving meeting locations:', error);
  },

  getPreciseHourForZone(date: Date, timezone: string): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: timezone
    }).formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return hour + (minute / 60);
  },

  checkGlobalOverlap(locations: MeetingLocation[], utcHour: number, utcMin: number): boolean {
    if (locations.length === 0) return false;
    const testDate = new Date();
    testDate.setUTCHours(utcHour, utcMin, 0, 0);

    return locations.every(loc => {
      const localHour = this.getPreciseHourForZone(testDate, loc.timezone);
      return localHour >= loc.workStart && localHour < loc.workEnd;
    });
  }
};
