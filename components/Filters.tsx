'use client';

import { ItemFilters, BossStatus, StaffStatus } from '@/lib/types';
import { useState } from 'react';

interface FiltersProps {
    filters: ItemFilters;
    onFiltersChange: (filters: ItemFilters) => void;
    manufacturers: string[];
    jobBagNumbers: string[];
}

export default function Filters({
    filters,
    onFiltersChange,
    manufacturers,
    jobBagNumbers,
}: FiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (key: keyof ItemFilters, value: string) => {
        const newValue = value === 'all' || value === '' ? undefined : value;
        onFiltersChange({ ...filters, [key]: newValue });
    };

    const activeFilterCount = [
        filters.boss_status,
        filters.staff_status,
        filters.manufacturer,
        filters.job_bag_number,
    ].filter(Boolean).length;

    const clearFilters = () => {
        onFiltersChange({
            search: filters.search,
            boss_status: undefined,
            staff_status: undefined,
            manufacturer: undefined,
            job_bag_number: undefined,
        });
    };

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 space-y-4">
            {/* Search */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    placeholder="Search by part name, manufacturer, or job bag..."
                    value={filters.search || ''}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                    <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Filter Dropdowns */}
            {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Boss Status */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Boss Status
                        </label>
                        <select
                            value={filters.boss_status || 'all'}
                            onChange={(e) => handleChange('boss_status', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="">Pending</option>
                            <option value="ordered">Ordered</option>
                            <option value="backorder">Backorder</option>
                            <option value="discontinued">Discontinued</option>
                        </select>
                    </div>

                    {/* Staff Status */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Staff Status
                        </label>
                        <select
                            value={filters.staff_status || 'all'}
                            onChange={(e) => handleChange('staff_status', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="">Pending</option>
                            <option value="received">Received</option>
                            <option value="part_defective">Part Defective</option>
                            <option value="installed">Installed</option>
                        </select>
                    </div>

                    {/* Manufacturer */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Manufacturer
                        </label>
                        <select
                            value={filters.manufacturer || 'all'}
                            onChange={(e) => handleChange('manufacturer', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            {manufacturers.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Job Bag Number */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Job Bag Number
                        </label>
                        <select
                            value={filters.job_bag_number || 'all'}
                            onChange={(e) => handleChange('job_bag_number', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            {jobBagNumbers.map((jb) => (
                                <option key={jb} value={jb}>
                                    {jb}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
