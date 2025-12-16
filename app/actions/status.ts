'use server';

import { createClient } from '@/lib/supabase/server';
import { BossStatus, StaffStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function getUserRole(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
    return data?.role;
}

async function createAuditLog(
    supabase: Awaited<ReturnType<typeof createClient>>,
    itemId: string,
    fieldChanged: 'boss_status' | 'staff_status',
    oldValue: string | null,
    newValue: string | null,
    userId: string
) {
    await supabase.from('audit_logs').insert({
        request_item_id: itemId,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue || 'pending',
        changed_by: userId,
    });
}

export async function updateBossStatus(itemId: string, newStatus: BossStatus) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Not authenticated');
    }

    // Verify user is boss
    const role = await getUserRole(user.id, supabase);
    if (role !== 'boss') {
        throw new Error('Only boss can update boss status');
    }

    // Get current item for audit log
    const { data: currentItem } = await supabase
        .from('request_items')
        .select('boss_status')
        .eq('id', itemId)
        .single();

    // Update status
    const { error: updateError } = await supabase
        .from('request_items')
        .update({ boss_status: newStatus })
        .eq('id', itemId);

    if (updateError) {
        console.error('Error updating boss status:', updateError);
        throw new Error('Failed to update status');
    }

    // Create audit log
    await createAuditLog(
        supabase,
        itemId,
        'boss_status',
        currentItem?.boss_status,
        newStatus,
        user.id
    );

    revalidatePath('/pick-list');
    revalidatePath('/receiving');

    return { success: true };
}

export async function updateStaffStatus(itemId: string, newStatus: StaffStatus) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Not authenticated');
    }

    // Check for admin override
    const adminOverride = process.env.ADMIN_CAN_MODIFY_STAFF_STATUS === 'true';
    const role = await getUserRole(user.id, supabase);

    // Verify user is staff (or has admin override)
    if (role !== 'staff' && !(role === 'boss' && adminOverride)) {
        throw new Error('Only staff can update staff status');
    }

    // Get current item
    const { data: currentItem } = await supabase
        .from('request_items')
        .select('boss_status, staff_status')
        .eq('id', itemId)
        .single();

    // Check if item is discontinued (staff cannot update)
    if (currentItem?.boss_status === 'discontinued' && role === 'staff') {
        throw new Error('Cannot update discontinued items');
    }

    // Update status and installed_at
    const updateData: { staff_status: StaffStatus; installed_at?: string | null } = {
        staff_status: newStatus,
    };

    if (newStatus === 'installed') {
        updateData.installed_at = new Date().toISOString();
    } else {
        updateData.installed_at = null; // Reset if changing away from installed
    }

    const { error: updateError } = await supabase
        .from('request_items')
        .update(updateData)
        .eq('id', itemId);

    if (updateError) {
        console.error('Error updating staff status:', updateError);
        throw new Error('Failed to update status');
    }

    // Create audit log
    await createAuditLog(
        supabase,
        itemId,
        'staff_status',
        currentItem?.staff_status,
        newStatus,
        user.id
    );

    revalidatePath('/pick-list');
    revalidatePath('/receiving');

    return { success: true };
}

export async function bulkUpdateBossStatus(itemIds: string[], newStatus: BossStatus) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Not authenticated');
    }

    // Verify user is boss
    const role = await getUserRole(user.id, supabase);
    if (role !== 'boss') {
        throw new Error('Only boss can update boss status');
    }

    // Get current items for audit logs
    const { data: currentItems } = await supabase
        .from('request_items')
        .select('id, boss_status')
        .in('id', itemIds);

    // Update all items
    const { error: updateError } = await supabase
        .from('request_items')
        .update({ boss_status: newStatus })
        .in('id', itemIds);

    if (updateError) {
        console.error('Error bulk updating boss status:', updateError);
        throw new Error('Failed to update statuses');
    }

    // Create audit logs for each item
    if (currentItems) {
        for (const item of currentItems) {
            await createAuditLog(
                supabase,
                item.id,
                'boss_status',
                item.boss_status,
                newStatus,
                user.id
            );
        }
    }

    revalidatePath('/pick-list');
    revalidatePath('/receiving');

    return { success: true };
}
