'use client';

import Navigation from '@/components/Navigation';
import ItemsTable from '@/components/ItemsTable';
import Filters from '@/components/Filters';
import BulkActions from '@/components/BulkActions';
import { createClient } from '@/lib/supabase/client';
import { updateBossStatus, bulkUpdateBossStatus } from '@/app/actions/status';
import { deleteItem, bulkDeleteItems } from '@/app/actions/delete';
import { RequestItem, ItemFilters, BossStatus, UserRole } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const handleBulkDelete = async () => {
        // Optimistically remove from UI
        setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));

        try {
            await bulkDeleteItems(selectedIds);
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to bulk delete:', error);
            fetchItems();
        }
    };

    const handleExportCSV = () => {
        // Filter for pending items (boss_status is null or empty)
        let itemsToExport = items.filter((item) => !item.boss_status);

        // If items are selected, filter the pending list to only include selected ones
        if (selectedIds.length > 0) {
            itemsToExport = itemsToExport.filter((item) => selectedIds.includes(item.id));
        }

        if (itemsToExport.length === 0) {
            alert('No pending items found to export.');
            return;
        }

        // Define headers
        const headers = [
            'Job Bag',
            'Manufacturer',
            'Part Name',
            'Description',
            'Quantity',
            'Boss Status',
            'Staff Status',
            'Created At'
        ];

        // Map items to rows
        const rows = itemsToExport.map((item) => [
            item.job_bag_number,
            item.manufacturer,
            item.part_name,
            `"${(item.description || '').replace(/"/g, '""')}"`, // Escape quotes
            item.quantity,
            item.boss_status || 'Pending',
            item.staff_status || 'Pending',
            new Date(item.created_at).toLocaleDateString()
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pending_items_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        // Filter for pending items (boss_status is null or empty)
        let itemsToExport = items.filter((item) => !item.boss_status);

        // If items are selected, filter the pending list to only include selected ones
        if (selectedIds.length > 0) {
            itemsToExport = itemsToExport.filter((item) => selectedIds.includes(item.id));
        }

        if (itemsToExport.length === 0) {
            alert('No pending items found to export.');
            return;
        }

        // Create PDF document
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleDateString();

        // Add title
        doc.setFontSize(18);
        doc.text('Pending Items Report', 14, 22);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated: ${currentDate}`, 14, 30);

        // Define table columns
        const columns = [
            { header: 'Job Bag', dataKey: 'job_bag_number' },
            { header: 'Manufacturer', dataKey: 'manufacturer' },
            { header: 'Part Name', dataKey: 'part_name' },
            { header: 'Description', dataKey: 'description' },
            { header: 'Qty', dataKey: 'quantity' },
            { header: 'Created', dataKey: 'created_at' }
        ];

        // Prepare table data
        const tableData = itemsToExport.map((item) => ({
            job_bag_number: item.job_bag_number,
            manufacturer: item.manufacturer,
            part_name: item.part_name,
            description: item.description || '-',
            quantity: item.quantity,
            created_at: new Date(item.created_at).toLocaleDateString()
        }));

        // Generate table
        autoTable(doc, {
            columns: columns,
            body: tableData,
            startY: 36,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [51, 65, 85], // slate-700
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [241, 245, 249], // slate-100
            },
            columnStyles: {
                description: { cellWidth: 40 },
                quantity: { cellWidth: 15, halign: 'center' },
            },
        });

        // Add footer with item count
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Total Items: ${itemsToExport.length} | Page ${i} of ${pageCount}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }

        // Save the PDF
        doc.save(`pending_items_${new Date().toISOString().split('T')[0]}.pdf`);
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
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Pick List</h1>
                        <p className="text-slate-400 mt-1">
                            Manage parts orders. Select multiple items for bulk updates.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800/70 text-white font-medium rounded-lg border border-red-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Export PDF
                        </button>
                    </div>
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
                    onBulkDelete={handleBulkDelete}
                    onClearSelection={() => setSelectedIds([])}
                    userRole={userRole}
                />
            </main>
        </div>
    );
}
