'use client';

import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavigationProps {
    userRole?: UserRole;
}

export default function Navigation({ userRole }: NavigationProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<UserRole | null>(userRole || null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserEmail(user.email || null);

                if (!userRole) {
                    const { data: roleData } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', user.id)
                        .single();

                    if (roleData) {
                        setRole(roleData.role as UserRole);
                    }
                }
            }
        };

        fetchUserData();
    }, [userRole]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const staffLinks = [
        { href: '/new-request', label: 'New Request' },
        { href: '/receiving', label: 'Receiving' },
    ];

    const bossLinks = [
        { href: '/pick-list', label: 'Pick List' },
    ];

    const links = role === 'boss' ? [...bossLinks, ...staffLinks] : staffLinks;

    return (
        <nav className="bg-slate-900 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">RT</span>
                            </div>
                            <span className="text-white font-semibold text-lg hidden sm:block">
                                Parts Tracker
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Info & Logout */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-slate-400">{userEmail}</span>
                            {role && (
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${role === 'boss'
                                        ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                        : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                    }`}>
                                    {role === 'boss' ? 'Admin' : 'Staff'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-700">
                    <div className="px-4 py-3 space-y-1">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname === link.href
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 mt-3 border-t border-slate-700">
                            <div className="px-4 py-2 text-sm text-slate-400">
                                {userEmail}
                                {role && (
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${role === 'boss'
                                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                            : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                        }`}>
                                        {role === 'boss' ? 'Admin' : 'Staff'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
