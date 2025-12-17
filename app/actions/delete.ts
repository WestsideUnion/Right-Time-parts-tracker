'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getUserRole(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
    return data?.role;
}

export async function deleteItem(itemId: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Not authenticated');
    }

    // Verify user is system_admin
    const role = await getUserRole(user.id, supabase);
    if (role !== 'system_admin') {
        throw new Error('Only system admin can delete items');
    }

    // Delete the item
    const { error: deleteError } = await supabase
        .from('request_items')
        .delete()
        .eq('id', itemId);

    if (deleteError) {
        console.error('Error deleting item:', deleteError);
        throw new Error('Failed to delete item');
    }

    revalidatePath('/pick-list');
    revalidatePath('/receiving');

    return { success: true };
}

export async function bulkDeleteItems(itemIds: string[]) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Not authenticated');
    }

    // Verify user is system_admin
    const role = await getUserRole(user.id, supabase);
    if (role !== 'system_admin') {
        throw new Error('Only system admin can delete items');
    }

    // Delete all items
    const { error: deleteError } = await supabase
        .from('request_items')
        .delete()
        .in('id', itemIds);

    if (deleteError) {
        console.error('Error bulk deleting items:', deleteError);
        throw new Error('Failed to delete items');
    }

    revalidatePath('/pick-list');
    revalidatePath('/receiving');

    return { success: true };
}
