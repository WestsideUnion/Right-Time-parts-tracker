'use client';

import Navigation from '@/components/Navigation';
import ItemsTable from '@/components/ItemsTable';
import Filters from '@/components/Filters';
import BulkActions from '@/components/BulkActions';
import { createClient } from '@/lib/supabase/client';
import { updateBossStatus, bulkUpdateBossStatus } from '@/app/actions/status';
import { deleteItem } from '@/app/actions/delete';
import { RequestItem, ItemFilters, BossStatus, UserRole } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';

export default function PickListPage() {
    const [items, setItems] = useState<RequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<ItemFilters>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [userRole, setUserRole] = useState<UserRole>('boss');

    useEffect(() => {
        fetchUserRoleAndItems();
    }, []);

    const fetchUserRoleAndItems = async () => {
        const supabase = createClient();

        // Fetch user role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();
            if (roleData) {
                setUserRole(roleData.role as UserRole);
            }
        }

        // Fetch items
        await fetchItems();
    };

    const fetchItems = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('request_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setItems(data);
        }
        setIsLoading(false);
    };

    const handleBossStatusChange = async (itemId: string, status: string | null) => {
        // Optimistically update the UI
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, boss_status: status as BossStatus }
                    : item
            )
        );

        try {
            await updateBossStatus(itemId, status as BossStatus);
        } catch (error) {
            // Rollback on error
            console.error('Failed to update status:', error);
            fetchItems();
            throw error;
        }
    };

    const handleBulkUpdate = async (status: BossStatus) => {
        // Optimistically update the UI
        setItems((prev) =>
            prev.map((item) =>
                selectedIds.includes(item.id)
                    ? { ...item, boss_status: status }
                    : item
            )
        );

        try {
            await bulkUpdateBossStatus(selectedIds, status);
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to bulk update:', error);
            fetchItems();
            throw error;
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        // Optimistically remove from UI
        setItems((prev) => prev.filter((item) => item.id !== itemId));

        try {
            await deleteItem(itemId);
        } catch (error) {
            console.error('Failed to delete:', error);
            fetchItems();
            throw error;
        }
    };

    // Get unique values for filters
    const manufacturers = useMemo(
        () => [...new Set(items.map((item) => item.manufacturer))].sort(),
        [items]
    );
    const jobBagNumbers = useMemo(
        () => [...new Set(items.map((item) => item.job_bag_number))].sort(),
        [items]
    );

    // Stats
    const pendingCount = items.filter((i) => !i.boss_status).length;
    const orderedCount = items.filter((i) => i.boss_status === 'ordered').length;
    const backorderCount = items.filter((i) => i.boss_status === 'backorder').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navigation userRole="boss" />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <svg
                            className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <p className="text-slate-400">Loading items...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Navigation userRole={userRole} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Pick List</h1>
                    <p className="text-slate-400 mt-1">
                        Manage parts orders. Select multiple items for bulk updates.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Total Items</p>
                        <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-slate-400 mt-1">{pendingCount}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Ordered</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">{orderedCount}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Backorder</p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">{backorderCount}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Filters
                        filters={filters}
                        onFiltersChange={setFilters}
                        manufacturers={manufacturers}
                        jobBagNumbers={jobBagNumbers}
                    />
                </div>

                {/* Items Table */}
                <ItemsTable
                    items={items}
                    userRole={userRole}
                    filters={filters}
                    onBossStatusChange={handleBossStatusChange}
                    onDeleteItem={handleDeleteItem}
                    selectable={true}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                />

                {/* Bulk Actions */}
                <BulkActions
                    selectedCount={selectedIds.length}
                    onBulkUpdate={handleBulkUpdate}
                    onClearSelection={() => setSelectedIds([])}
                />
            </main>
        </div>
    );
}
