
import { supabase } from '../lib/supabase';
import { Asset } from '../types';

// Helper to get current user ID
const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

export const assetService = {
    async uploadReceipt(file: File): Promise<string> {
        const userId = await getUserId();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId || 'anon'}/${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    async saveAsset(asset: Omit<Asset, 'id' | 'createdAt'>): Promise<void> {
        const userId = await getUserId();
        if (!userId) {
            console.warn('assetService.saveAsset: No user ID');
            return;
        }

        const { error } = await supabase
            .from('assets')
            .insert([
                {
                    ...asset,
                    user_id: userId,
                    createdAt: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error("Error saving asset:", error);
            throw error;
        }
    },

    async getAssets(): Promise<Asset[]> {
        const userId = await getUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .eq('user_id', userId)
            .order('purchaseDate', { ascending: false });

        if (error) {
            console.error("Error fetching assets:", error);
            throw error;
        }

        return data || [];
    },

    async deleteAsset(id: string): Promise<void> {
        const { error, count } = await supabase
            .from('assets')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error("Error deleting asset:", error);
            throw error;
        }

        if (count === 0) {
            console.warn(`assetService.deleteAsset: No rows deleted for id ${id}`);
        }
    }
};
