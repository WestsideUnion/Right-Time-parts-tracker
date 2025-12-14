'use server';

import { createClient } from '@/lib/supabase/server';
import { RequestItemInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createRequest(items: RequestItemInput[], notes?: string) {
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Not authenticated' };
    }

    // Validate items
    if (!items || items.length === 0) {
        return { error: 'At least one item is required' };
    }

    for (const item of items) {
        if (!item.job_bag_number?.trim()) {
            return { error: 'Job bag number is required for all items' };
        }
        if (!item.manufacturer?.trim()) {
            return { error: 'Manufacturer is required for all items' };
        }
        if (!item.part_name?.trim()) {
            return { error: 'Part name is required for all items' };
        }
        if (!item.quantity || item.quantity < 1) {
            return { error: 'Quantity must be at least 1 for all items' };
        }
    }

    // Create request
    const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
            created_by: user.id,
            notes: notes || null,
        })
        .select()
        .single();

    if (requestError) {
        console.error('Error creating request:', requestError);
        return { error: 'Failed to create request' };
    }

    // Create request items
    const itemsToInsert = items.map((item) => ({
        request_id: request.id,
        job_bag_number: item.job_bag_number.trim(),
        manufacturer: item.manufacturer.trim(),
        part_name: item.part_name.trim(),
        description: item.description?.trim() || null,
        quantity: item.quantity,
        created_by: user.id,
    }));

    const { error: itemsError } = await supabase
        .from('request_items')
        .insert(itemsToInsert);

    if (itemsError) {
        console.error('Error creating items:', itemsError);
        // Try to delete the request since items failed
        await supabase.from('requests').delete().eq('id', request.id);
        return { error: 'Failed to create items' };
    }

    revalidatePath('/receiving');
    revalidatePath('/pick-list');

    return { success: true, requestId: request.id };
}
