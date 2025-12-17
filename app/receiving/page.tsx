'use client';

import Navigation from '@/components/Navigation';
import ItemsTable from '@/components/ItemsTable';
import Filters from '@/components/Filters';
import { createClient } from '@/lib/supabase/client';
import { updateStaffStatus } from '@/app/actions/status';
import { deleteItem } from '@/app/actions/delete';
import { RequestItem, ItemFilters, UserRole } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

export default function ReceivingPage() {
    const [items, setItems] = useState<RequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<ItemFilters>({});
    const [userRole, setUserRole] = useState<UserRole>('staff');

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
            // Filter out items that indicate 'installed' > 3 days ago
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const filteredAndSortedData = data.filter((item) => {
                if (item.staff_status === 'installed' && item.installed_at) {
                    const installedDate = new Date(item.installed_at);
                    return installedDate > threeDaysAgo;
                }
                return true;
            });

            setItems(filteredAndSortedData);
        }
        setIsLoading(false);
    };

    const handleStaffStatusChange = async (itemId: string, status: string | null) => {
        // Optimistically update the UI
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, staff_status: status as RequestItem['staff_status'] }
                    : item
            )
        );

        try {
            await updateStaffStatus(itemId, status as RequestItem['staff_status']);
        } catch (error) {
            // Rollback on error
            console.error('Failed to update status:', error);
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
    const pendingCount = items.filter((i) => !i.staff_status && i.boss_status === 'ordered').length;
    const receivedCount = items.filter((i) => i.staff_status === 'received').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navigation userRole={userRole} />
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Receiving</h1>
                        <p className="text-slate-400 mt-1">
                            Update status when parts arrive
                        </p>
                    </div>
                    <Link
                        href="/new-request"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Request
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Total Items</p>
                        <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Pending Arrival</p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Received</p>
                        <p className="text-2xl font-bold text-green-400 mt-1">{receivedCount}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm">Unique Job Bags</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">{jobBagNumbers.length}</p>
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
                    onStaffStatusChange={handleStaffStatusChange}
                    onDeleteItem={handleDeleteItem}
                />
            </main>
        </div>
    );
}
