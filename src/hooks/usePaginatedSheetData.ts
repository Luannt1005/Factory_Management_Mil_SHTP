'use client';

/**
 * Custom Hook: usePaginatedSheetData
 * Fetches employee data with server-side pagination
 * Only loads the current page, reducing initial load time and memory usage
 */

import useSWR from 'swr';
import { useState, useCallback, useMemo } from 'react';
import { swrFetcher } from '@/lib/api-client';
import { OrgNode } from '@/types/orgchart';
import { headcountApi } from '@/features/headcount/services/headcountApi';

interface PaginatedResponse {
    success: boolean;
    data: any[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface UsePaginatedSheetDataOptions {
    initialPage?: number;
    pageSize?: number;
    enabled?: boolean;
}

// Transformer function (same as useSheetData)
function transformSheetData(rawData: any[]): OrgNode[] {
    if (!Array.isArray(rawData)) return [];

    return rawData.map((row) => {
        const id = row['Emp ID'] || row['Employee ID'] || row['id'] || row['ID'];
        const pid = row['Manager ID'] || row['Supervisor ID'] || row['Line Manager'] || row['pid'] || row['PID'];
        const name = row['FullName '] || row['FullName'] || row['Employee Name'] || row['Name'] || row['Full Name'] || row['name'];
        const title = row['Job Title'] || row['Title'] || row['Position'] || row['title'];
        const dept = row['Dept'] || row['Department'] || row['dept'];
        const img = row['Photo'] || row['Image'] || row['img'] || row['Avatar'];

        return {
            ...row,
            id: id ? String(id).trim() : `unknown-${Math.random()}`,
            pid: pid ? String(pid).trim() : '',
            name: name || 'Unknown',
            title: title || '',
            dept: dept || '',
            img: img || '',
            tags: [dept]
        } as OrgNode;
    });
}

export function usePaginatedSheetData(options: UsePaginatedSheetDataOptions = {}) {
    const { initialPage = 1, pageSize = 20, enabled = true } = options;
    const [page, setPage] = useState(initialPage);

    const apiUrl = enabled ? headcountApi.getPaginatedSheetUrl(page, pageSize) : null;

    const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>(
        apiUrl,
        swrFetcher,
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
            dedupingInterval: 5 * 60 * 1000, // 5 minutes
            keepPreviousData: true, // Keep showing previous data while loading new page
        }
    );

    // Transform raw data to OrgNode format
    const nodes = useMemo(() => {
        return transformSheetData(data?.data || []);
    }, [data?.data]);

    const goToPage = useCallback((newPage: number) => {
        const maxPage = data?.totalPages || 1;
        setPage(Math.max(1, Math.min(newPage, maxPage)));
    }, [data?.totalPages]);

    const nextPage = useCallback(() => {
        if (data && page < data.totalPages) {
            setPage(p => p + 1);
        }
    }, [data, page]);

    const prevPage = useCallback(() => {
        if (page > 1) {
            setPage(p => p - 1);
        }
    }, [page]);

    const resetPage = useCallback(() => {
        setPage(1);
    }, []);

    return {
        // Data
        nodes,
        rawData: data?.data || [],

        // Pagination info
        page,
        pageSize,
        totalPages: data?.totalPages || 1,
        total: data?.total || 0,

        // Calculated values
        startIndex: (page - 1) * pageSize + 1,
        endIndex: Math.min(page * pageSize, data?.total || 0),

        // State
        loading: isLoading,
        error: error as Error | null,

        // Actions
        goToPage,
        nextPage,
        prevPage,
        resetPage,
        setPage,
        mutate,

        // Helpers
        hasNextPage: data ? page < data.totalPages : false,
        hasPrevPage: page > 1,
    };
}

export default usePaginatedSheetData;
