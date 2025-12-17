'use client';

import { BossStatus, UserRole } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';

interface BulkActionsProps {
    selectedCount: number;
    onBulkUpdate: (status: BossStatus) => Promise<void>;
    onBulkDelete?: () => Promise<void>;
    onClearSelection: () => void;
    userRole?: UserRole;
}

const statusOptions: { value: BossStatus; label: string; color: string }[] = [
    { value: 'ordered', label: 'Ordered', color: 'bg-blue-600' },
    { value: 'backorder', label: 'Backorder', color: 'bg-amber-600' },
    { value: 'discontinued', label: 'Discontinued', color: 'bg-red-600' },
];

export default function BulkActions({
    selectedCount,
    onBulkUpdate,
    onBulkDelete,
    onClearSelection,
    userRole,
}: BulkActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdate = async (status: BossStatus) => {
        setIsUpdating(true);
        setIsOpen(false);
        try {
            await onBulkUpdate(status);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!onBulkDelete) return;
        if (!confirm(`Are you sure you want to delete ${selectedCount} items? This cannot be undone.`)) {
            return;
        }
        setIsDeleting(true);
        try {
            await onBulkDelete();
        } finally {
            setIsDeleting(false);
        }
    };

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-bold">
                        {selectedCount}
                    </span>
                    <span className="text-slate-300 text-sm">
                        item{selectedCount > 1 ? 's' : ''} selected
                    </span>
                </div>

                <div className="w-px h-8 bg-slate-600" />

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={isUpdating || isDeleting}
                        className={`
              px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
              font-medium text-sm flex items-center gap-2 transition-colors
              ${isUpdating ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}
            `}
                    >
                        {isUpdating ? 'Updating...' : 'Set Status'}
                        <svg
                            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isOpen && (
                        <div className="absolute bottom-full mb-2 left-0 w-44 rounded-lg bg-slate-700 border border-slate-600 shadow-xl overflow-hidden">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleUpdate(option.value)}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors"
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${option.color}`} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bulk Delete Button for System Admin */}
                {userRole === 'system_admin' && onBulkDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || isUpdating}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </>
                        )}
                    </button>
                )}

                <button
                    onClick={onClearSelection}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Clear selection"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

