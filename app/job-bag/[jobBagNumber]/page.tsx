import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase/server';
import { RequestItem, AuditLog, UserRole } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JobBagClient from './JobBagClient';

interface PageProps {
    params: Promise<{
        jobBagNumber: string;
    }>;
}

export default async function JobBagPage({ params }: PageProps) {
    const { jobBagNumber } = await params;
    const decodedJobBagNumber = decodeURIComponent(jobBagNumber);
    const supabase = await createClient();

    // Get current user and role
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        notFound();
    }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    const userRole = (roleData?.role as UserRole) || 'staff';

    // Get items for this job bag
    const { data: items, error: itemsError } = await supabase
        .from('request_items')
        .select('*')
        .eq('job_bag_number', decodedJobBagNumber)
        .order('created_at', { ascending: false });

    if (itemsError || !items || items.length === 0) {
        notFound();
    }

    // Get audit logs for these items
    const itemIds = items.map((i: RequestItem) => i.id);
    const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .in('request_item_id', itemIds)
        .order('changed_at', { ascending: false });

    return (
        <div className="min-h-screen bg-slate-950">
            <Navigation userRole={userRole} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href={userRole === 'boss' ? '/pick-list' : '/receiving'}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to {userRole === 'boss' ? 'Pick List' : 'Receiving'}
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{decodedJobBagNumber}</h1>
                            <p className="text-slate-400">
                                {items.length} item{items.length > 1 ? 's' : ''} in this job bag
                            </p>
                        </div>
                    </div>
                </div>

                {/* Client-side interactivity */}
                <JobBagClient
                    items={items as RequestItem[]}
                    auditLogs={(auditLogs || []) as AuditLog[]}
                    userRole={userRole}
                />
            </main>
        </div>
    );
}
