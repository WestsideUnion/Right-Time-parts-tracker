'use client';

import { BossStatus } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';

interface BulkActionsProps {
    selectedCount: number;
    onBulkUpdate: (status: BossStatus) => Promise<void>;
    onClearSelection: () => void;
}

const statusOptions: { value: BossStatus; label: string; color: string }[] = [
    { value: 'ordered', label: 'Ordered', color: 'bg-blue-600' },
    { value: 'backorder', label: 'Backorder', color: 'bg-amber-600' },
    { value: 'discontinued', label: 'Discontinued', color: 'bg-red-600' },
];

export default function BulkActions({
    selectedCount,
    onBulkUpdate,
    onClearSelection,
}: BulkActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
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
                        disabled={isUpdating}
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
