'use client';

import ItemsTable from '@/components/ItemsTable';
import { updateBossStatus, updateStaffStatus } from '@/app/actions/status';
import { deleteItem } from '@/app/actions/delete';
import { RequestItem, AuditLog, UserRole, BossStatus, StaffStatus } from '@/lib/types';
import { useState } from 'react';

interface JobBagClientProps {
    items: RequestItem[];
    auditLogs: AuditLog[];
    userRole: UserRole;
}

export default function JobBagClient({ items: initialItems, auditLogs, userRole }: JobBagClientProps) {
    const [items, setItems] = useState(initialItems);

    const handleBossStatusChange = async (itemId: string, status: string | null) => {
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
            // Rollback
            setItems(initialItems);
            throw error;
        }
    };

    const handleStaffStatusChange = async (itemId: string, status: string | null) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, staff_status: status as StaffStatus }
                    : item
            )
        );

        try {
            await updateStaffStatus(itemId, status as StaffStatus);
        } catch (error) {
            // Rollback
            setItems(initialItems);
            throw error;
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        // Optimistically remove from UI
        setItems((prev) => prev.filter((item) => item.id !== itemId));

        try {
            await deleteItem(itemId);
        } catch (error) {
            setItems(initialItems);
            throw error;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    const formatStatus = (value: string | null) => {
        if (!value || value === 'pending') return 'Pending';
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-8">
            {/* Items Table */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
                <ItemsTable
                    items={items}
                    userRole={userRole}
                    onBossStatusChange={userRole === 'boss' || userRole === 'system_admin' ? handleBossStatusChange : undefined}
                    onStaffStatusChange={userRole === 'staff' || userRole === 'system_admin' ? handleStaffStatusChange : undefined}
                    onDeleteItem={userRole === 'system_admin' ? handleDeleteItem : undefined}
                />
            </div>

            {/* Audit Log */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Activity History</h2>
                {auditLogs.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                        <svg
                            className="w-10 h-10 mx-auto text-slate-600 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-slate-400">No status changes recorded yet.</p>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="divide-y divide-slate-700/50">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-4 flex items-start gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.field_changed === 'boss_status'
                                            ? 'bg-purple-900/50 text-purple-400'
                                            : 'bg-blue-900/50 text-blue-400'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${log.field_changed === 'boss_status'
                                                    ? 'bg-purple-900/50 text-purple-300'
                                                    : 'bg-blue-900/50 text-blue-300'
                                                    }`}
                                            >
                                                {log.field_changed === 'boss_status' ? 'Boss Status' : 'Staff Status'}
                                            </span>
                                            <span className="text-slate-500 text-sm">
                                                {formatDate(log.changed_at)}
                                            </span>
                                        </div>
                                        <p className="text-white mt-1">
                                            <span className="text-slate-400">{formatStatus(log.old_value)}</span>
                                            <span className="text-slate-600 mx-2">→</span>
                                            <span className="font-medium">{formatStatus(log.new_value)}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
