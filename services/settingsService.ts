
import { supabase } from '../lib/supabase';

export interface UserSettings {
    user_id: string;
    pinned_modules: string[];
}

export const settingsService = {
    async getSettings(userId: string): Promise<UserSettings | null> {
        if (!userId) {
            console.warn('settingsService: getSettings called without userId');
            return null;
        }

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user settings:', error);
            return null;
        }

        if (!data) {
            return { user_id: userId, pinned_modules: [] };
        }

        return {
            ...data,
            pinned_modules: data.pinned_modules || []
        } as UserSettings;
    },

    async updatePinnedModules(userId: string, pinnedModules: string[]): Promise<void> {
        console.log('settingsService: updatePinnedModules called', pinnedModules);

        if (!userId) {
            console.error('settingsService: No user ID provided');
            throw new Error('No user logged in');
        }

        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    pinned_modules: pinnedModules,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('settingsService: Error updating settings', error);
                throw error;
            }
            console.log('settingsService: Settings updated successfully');
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
                console.warn('settingsService: Update aborted');
                return;
            }
            throw err;
        }
    }
};
