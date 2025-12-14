'use client';

import Navigation from '@/components/Navigation';
import { createRequest } from '@/app/actions/requests';
import { RequestItemInput } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LineItem extends RequestItemInput {
    id: string;
}

export default function NewRequestPage() {
    const router = useRouter();
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<LineItem[]>([
        {
            id: crypto.randomUUID(),
            job_bag_number: '',
            manufacturer: '',
            part_name: '',
            description: '',
            quantity: 1,
        },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addItem = () => {
        // Copy job_bag_number from last item for convenience
        const lastItem = items[items.length - 1];
        setItems([
            ...items,
            {
                id: crypto.randomUUID(),
                job_bag_number: lastItem?.job_bag_number || '',
                manufacturer: '',
                part_name: '',
                description: '',
                quantity: 1,
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof RequestItemInput, value: string | number) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const itemsToSubmit: RequestItemInput[] = items.map(({ job_bag_number, manufacturer, part_name, description, quantity }) => ({
            job_bag_number,
            manufacturer,
            part_name,
            description,
            quantity,
        }));

        const result = await createRequest(itemsToSubmit, notes);

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
            return;
        }

        router.push('/receiving');
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">New Parts Request</h1>
                    <p className="text-slate-400 mt-1">
                        Add parts you need. All items will be sent to the boss for ordering.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Request Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Any special instructions or notes..."
                        />
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4 mb-6">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-slate-400">
                                        Item {index + 1}
                                    </h3>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Job Bag Number */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Job Bag Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={item.job_bag_number}
                                            onChange={(e) => updateItem(item.id, 'job_bag_number', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="JB-2024-001"
                                        />
                                    </div>

                                    {/* Manufacturer */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Manufacturer *
                                        </label>
                                        <input
                                            type="text"
                                            value={item.manufacturer}
                                            onChange={(e) => updateItem(item.id, 'manufacturer', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="Bosch"
                                        />
                                    </div>

                                    {/* Part Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Part Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={item.part_name}
                                            onChange={(e) => updateItem(item.id, 'part_name', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="Brake Pads"
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            required
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Description (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="Front brake pads, ceramic..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Item Button */}
                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2 mb-8"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Item
                    </button>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                        >
                            {isSubmitting ? 'Submitting...' : `Submit Request (${items.length} item${items.length > 1 ? 's' : ''})`}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
