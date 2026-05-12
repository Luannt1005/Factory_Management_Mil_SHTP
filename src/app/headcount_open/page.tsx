"use client";

import HeadcountManager from "@/components/HeadcountManager";
import { useUser } from '@/app/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HeadcountOpenPage() {
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (user && (user.role === 'viewer' || user.orgchart_role === 'viewer')) {
            router.push('/');
        }
    }, [user, router]);

    if (user?.role === 'viewer' || user?.orgchart_role === 'viewer') return null;

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
            <HeadcountManager />
        </div>
    );
}
