"use client";

import DataImport from "@/components/DataImport";
import { useUser } from '@/app/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ImportPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === 'viewer') {
      router.push('/');
    }
  }, [user, router]);

  if (user?.role === 'viewer') return null;

  return (
    <div className="min-h-screen bg-transparent p-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto h-full bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-6">

        {/* Content (Title moved to header) */}

        {/* Rendering DataImport in Images mode */}
        <div className="flex-1">
          <DataImport mode="images" />
        </div>
      </div>
    </div>
  );
}