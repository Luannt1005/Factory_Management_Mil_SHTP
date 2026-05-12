'use client';

import SheetManagerTable from '@/components/SheetManagerTable';
import { useUser } from '@/app/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SheetManagerPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && (user.role === 'viewer' || user.orgchart_role === 'viewer')) {
      router.push('/');
    }
  }, [user, router]);

  if (user?.role === 'viewer' || user?.orgchart_role === 'viewer') return null;

  return (
    <SheetManagerTable
      enableApproval={false}
      enableDeleteAll={false}
    />
  );
}