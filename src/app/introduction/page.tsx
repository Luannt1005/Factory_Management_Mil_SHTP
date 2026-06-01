'use client';
 
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
 
export default function IntroductionPage() {
    const router = useRouter();
 
    useEffect(() => {
        router.replace('/introduction/about_shtp');
    }, [router]);
 
    return (
        <div className="min-h-screen bg-[var(--color-bg-page)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#db011c]" />
        </div>
    );
}
