'use client';

import { BossStatus, StaffStatus } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';

interface StatusDropdownProps {
    type: 'boss' | 'staff';
    currentValue: BossStatus | StaffStatus;
    onChange: (value: string | null) => Promise<void>;
    disabled?: boolean;
    isDiscontinued?: boolean;
}

const bossOptions: { value: string | null; label: string; color: string }[] = [
    { value: null, label: 'Pending', color: 'bg-slate-600' },
    { value: 'ordered', label: 'Ordered', color: 'bg-blue-600' },
    { value: 'backorder', label: 'Backorder', color: 'bg-amber-600' },
    { value: 'discontinued', label: 'Discontinued', color: 'bg-red-600' },
];

const staffOptions: { value: string | null; label: string; color: string }[] = [
    { value: null, label: 'Pending', color: 'bg-slate-600' },
    { value: 'received', label: 'Received', color: 'bg-green-600' },
    { value: 'part_defective', label: 'Part Defective', color: 'bg-orange-600' },
];

export default function StatusDropdown({
    type,
    currentValue,
    onChange,
    disabled = false,
    isDiscontinued = false,
}: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [optimisticValue, setOptimisticValue] = useState(currentValue);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = type === 'boss' ? bossOptions : staffOptions;
    const currentOption = options.find((o) => o.value === optimisticValue) || options[0];

    // Sync optimistic value with actual value
    useEffect(() => {
        setOptimisticValue(currentValue);
    }, [currentValue]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (value: string | null) => {
        if (value === optimisticValue) {
            setIsOpen(false);
            return;
        }

        const previousValue = optimisticValue;
        setOptimisticValue(value as BossStatus | StaffStatus);
        setIsOpen(false);
        setIsUpdating(true);

        try {
            await onChange(value);
        } catch (error) {
            // Rollback on error
            setOptimisticValue(previousValue);
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const isDisabled = disabled || isUpdating || (type === 'staff' && isDiscontinued);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                disabled={isDisabled}
                className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${currentOption.color} text-white
          ${isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:opacity-90 cursor-pointer shadow-sm hover:shadow'
                    }
          ${isUpdating ? 'animate-pulse' : ''}
        `}
            >
                <span>{currentOption.label}</span>
                {!isDisabled && (
                    <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-44 rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value ?? 'null'}
                            onClick={() => handleSelect(option.value)}
                            className={`
                w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-2
                transition-colors
                ${option.value === optimisticValue
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }
              `}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${option.color}`} />
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {type === 'staff' && isDiscontinued && (
                <p className="text-xs text-red-400 mt-1">Item discontinued</p>
            )}
        </div>
    );
}
