'use client';

import { ArrowPathIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import styles from "./sheet.module.css";

export default function Loading() {
    return (
        <div className={styles.container}>
            {/* Header Skeleton */}
            <div className={styles.header}>
                <div className="flex items-center gap-4">
                    <ShieldCheckIcon className="w-8 h-8 text-[#DB011C]" />
                    <h1>Milwaukee Tool HR Registry</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            <div className="space-y-4">
                {/* Filter Skeleton */}
                <div className={styles.filterBox}>
                    <div className={styles.filterRow}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={styles.filterInputWrapper}>
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <th key={i}>
                                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                                <tr key={row}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                                        <td key={col}>
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Skeleton */}
                <div className={styles.pagination}>
                    <div className="flex items-center justify-between px-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
