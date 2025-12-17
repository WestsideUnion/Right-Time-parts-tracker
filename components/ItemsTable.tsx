'use client';

import { RequestItem, UserRole, ItemFilters } from '@/lib/types';
import StatusDropdown from './StatusDropdown';
import Link from 'next/link';
import { useState, useMemo } from 'react';

interface ItemsTableProps {
    items: RequestItem[];
    userRole: UserRole;
    onBossStatusChange?: (itemId: string, status: string | null) => Promise<void>;
    onStaffStatusChange?: (itemId: string, status: string | null) => Promise<void>;
    onDeleteItem?: (itemId: string) => Promise<void>;
    filters?: ItemFilters;
    selectable?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

export default function ItemsTable({
    items,
    userRole,
    onBossStatusChange,
    onStaffStatusChange,
    onDeleteItem,
    filters = {},
    selectable = false,
    selectedIds = [],
    onSelectionChange,
}: ItemsTableProps) {
    const [sortField, setSortField] = useState<keyof RequestItem>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Apply search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            result = result.filter(
                (item) =>
                    item.part_name.toLowerCase().includes(search) ||
                    item.manufacturer.toLowerCase().includes(search) ||
                    item.job_bag_number.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            );
        }

        // Apply status filters
        if (filters.boss_status !== undefined && filters.boss_status !== 'all') {
            if (filters.boss_status === null || filters.boss_status === '') {
                result = result.filter((item) => item.boss_status === null);
            } else {
                result = result.filter((item) => item.boss_status === filters.boss_status);
            }
        }

        if (filters.staff_status !== undefined && filters.staff_status !== 'all') {
            if (filters.staff_status === null || filters.staff_status === '') {
                result = result.filter((item) => item.staff_status === null);
            } else {
                result = result.filter((item) => item.staff_status === filters.staff_status);
            }
        }

        // Apply manufacturer filter
        if (filters.manufacturer) {
            result = result.filter((item) => item.manufacturer === filters.manufacturer);
        }

        // Apply job bag filter
        if (filters.job_bag_number) {
            result = result.filter((item) => item.job_bag_number === filters.job_bag_number);
        }

        // Sort
        result.sort((a, b) => {
            const aVal = a[sortField] ?? '';
            const bVal = b[sortField] ?? '';
            const comparison = String(aVal).localeCompare(String(bVal));
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [items, filters, sortField, sortDirection]);

    const handleSort = (field: keyof RequestItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredItems.length) {
            onSelectionChange?.([]);
        } else {
            onSelectionChange?.(filteredItems.map((item) => item.id));
        }
    };

    const handleSelectItem = (itemId: string) => {
        if (selectedIds.includes(itemId)) {
            onSelectionChange?.(selectedIds.filter((id) => id !== itemId));
        } else {
            onSelectionChange?.([...selectedIds, itemId]);
        }
    };

    const SortIcon = ({ field }: { field: keyof RequestItem }) => (
        <svg
            className={`w-4 h-4 inline ml-1 transition-transform ${sortField === field
                ? sortDirection === 'asc'
                    ? ''
                    : 'rotate-180'
                : 'opacity-30'
                }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
    );

    if (filteredItems.length === 0) {
        return (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
                <svg
                    className="w-12 h-12 mx-auto text-slate-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No items found</h3>
                <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-visible">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50">
                            {selectable && (
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                    />
                                </th>
                            )}
                            <th
                                onClick={() => handleSort('job_bag_number')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                            >
                                Job Bag <SortIcon field="job_bag_number" />
                            </th>
                            <th
                                onClick={() => handleSort('manufacturer')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                            >
                                Manufacturer <SortIcon field="manufacturer" />
                            </th>
                            <th
                                onClick={() => handleSort('part_name')}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                            >
                                Part Name <SortIcon field="part_name" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Qty
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Boss Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Staff Status
                            </th>
                            {userRole === 'system_admin' && (
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredItems.map((item) => (
                            <tr
                                key={item.id}
                                className={`hover:bg-slate-800/80 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-900/20' : ''
                                    }`}
                            >
                                {selectable && (
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => handleSelectItem(item.id)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                        />
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/job-bag/${item.job_bag_number}`}
                                        className="text-blue-400 hover:text-blue-300 font-medium"
                                    >
                                        {item.job_bag_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-slate-300">{item.manufacturer}</td>
                                <td className="px-4 py-3">
                                    <div className="text-white font-medium">{item.part_name}</div>
                                    {item.description && (
                                        <div className="text-slate-500 text-sm truncate max-w-xs">
                                            {item.description}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-300">{item.quantity}</td>
                                <td className="px-4 py-3">
                                    <StatusDropdown
                                        type="boss"
                                        currentValue={item.boss_status}
                                        onChange={(value) =>
                                            onBossStatusChange?.(item.id, value) ?? Promise.resolve()
                                        }
                                        disabled={userRole !== 'boss' && userRole !== 'system_admin'}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <StatusDropdown
                                        type="staff"
                                        currentValue={item.staff_status}
                                        onChange={(value) =>
                                            onStaffStatusChange?.(item.id, value) ?? Promise.resolve()
                                        }
                                        disabled={userRole !== 'staff' && userRole !== 'system_admin'}
                                        isDiscontinued={item.boss_status === 'discontinued'}
                                    />
                                </td>
                                {userRole === 'system_admin' && (
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                                                    setDeletingId(item.id);
                                                    try {
                                                        await onDeleteItem?.(item.id);
                                                    } finally {
                                                        setDeletingId(null);
                                                    }
                                                }
                                            }}
                                            disabled={deletingId === item.id}
                                            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-700/50">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className={`p-4 space-y-3 ${selectedIds.includes(item.id) ? 'bg-blue-900/20' : ''
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            {selectable && (
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                        href={`/job-bag/${item.job_bag_number}`}
                                        className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                                    >
                                        {item.job_bag_number}
                                    </Link>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-400 text-sm">{item.manufacturer}</span>
                                </div>
                                <h3 className="text-white font-medium mt-1">{item.part_name}</h3>
                                {item.description && (
                                    <p className="text-slate-500 text-sm mt-0.5">{item.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 text-sm">Qty:</span>
                                <span className="text-white font-medium ml-1">{item.quantity}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs">Boss:</span>
                                <StatusDropdown
                                    type="boss"
                                    currentValue={item.boss_status}
                                    onChange={(value) =>
                                        onBossStatusChange?.(item.id, value) ?? Promise.resolve()
                                    }
                                    disabled={userRole !== 'boss' && userRole !== 'system_admin'}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs">Staff:</span>
                                <StatusDropdown
                                    type="staff"
                                    currentValue={item.staff_status}
                                    onChange={(value) =>
                                        onStaffStatusChange?.(item.id, value) ?? Promise.resolve()
                                    }
                                    disabled={userRole !== 'staff' && userRole !== 'system_admin'}
                                    isDiscontinued={item.boss_status === 'discontinued'}
                                />
                            </div>
                            {userRole === 'system_admin' && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this item?')) {
                                            setDeletingId(item.id);
                                            try {
                                                await onDeleteItem?.(item.id);
                                            } finally {
                                                setDeletingId(null);
                                            }
                                        }
                                    }}
                                    disabled={deletingId === item.id}
                                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Item count footer */}
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700 text-sm text-slate-400">
                Showing {filteredItems.length} of {items.length} items
            </div>
        </div>
    );
}
