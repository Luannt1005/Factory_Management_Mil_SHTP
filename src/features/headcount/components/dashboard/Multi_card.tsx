import React, { useMemo } from 'react';
import type { HeadcountDashboardFilter as EmployeeFilter } from '@/types/headcount.types';
import type { OrgNode } from '@/types/orgchart.types';
import { MetricCard } from '@/components/dashboard';

interface StatsCardsProps {
    className?: string;
    onFilterChange?: (filter: EmployeeFilter) => void;
    activeFilter?: EmployeeFilter;
    nodes: OrgNode[];  // Required prop
    loading?: boolean;
    isFiltered?: boolean;
}

interface CardInfo {
    title: string;
    count: number;
    filterType: EmployeeFilter['type'];
    filterValue: string;
    label?: string;
}

// Heroicons outline paths, one per role family (shown in red like the visitor analytics KPIs)
const ROLE_ICON_PATHS = {
    executive: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    leader: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
    engineer: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    office: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    floor: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    learner: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
} as const;

const ROLE_ICONS: Record<string, keyof typeof ROLE_ICON_PATHS> = {
    Director: 'executive', Manager: 'executive', Supervisor: 'executive',
    'Shift Leader': 'leader', Leader: 'leader',
    Engineer: 'engineer', Technician: 'engineer',
    Specialist: 'office', Coordinator: 'office', Clerk: 'office',
    Operator: 'floor', 'WH Keeper': 'floor',
    Trainee: 'learner', Intern: 'learner',
};

const RoleIcon = ({ title }: { title: string }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ROLE_ICON_PATHS[ROLE_ICONS[title] ?? 'office']} />
    </svg>
);

const StatsCards: React.FC<StatsCardsProps> = ({ className, onFilterChange, activeFilter, nodes, loading = false, isFiltered = false }) => {
    // Data is now passed from parent - no more independent fetching
    const error = null; // Error handling moved to parent

    // Helper to count by job title
    const countByTitle = (titleKeyword: string) => {
        if (!nodes || nodes.length === 0) return 0;

        const keywords = titleKeyword
            .toLowerCase()
            .trim()
            .split(/\s+/);

        return nodes.filter((node) => {
            const titleWords = (node['Job Title'] || node['title'] || '')
                .toLowerCase()
                .split(/[^a-z0-9]+/i);
            return keywords.every(k => titleWords.includes(k));
        }).length;
    };

    // Calculate all stats
    const stats = useMemo(() => {
        if (!nodes || nodes.length === 0) {
            return {
                specialist: 0,
                supervisor: 0,
                manager: 0,
                director: 0,
                shiftLeader: 0,
                leader: 0,
                warehouseKeeper: 0,
                coordinator: 0,
                technician: 0,
                operator: 0,
                trainee: 0,
                engineer: 0,
                staff: 0,
                idl: 0,
                dl: 0,
                clerk: 0,
                intern: 0,
                total: 0
            };
        }

        const counts = {
            staff: 0,
            idl: 0,
            dl: 0
        };

        nodes.forEach((node) => {
            const dlIdlStaff = (node['DL/IDL/Staff'] || '').toLowerCase();
            if (dlIdlStaff.includes('staff')) {
                counts.staff++;
            } else if (dlIdlStaff.includes('idl')) {
                counts.idl++;
            } else {
                counts.dl++;
            }
        });

        return {
            specialist: countByTitle('specialist'),
            supervisor: countByTitle('supervisor'),
            manager: countByTitle('manager'),
            director: countByTitle('director'),
            shiftLeader: countByTitle('shift leader'),
            leader: countByTitle('leader') - countByTitle('shift leader'),
            warehouseKeeper: countByTitle('warehouse keeper') + countByTitle('warehouse storekeeper'),
            coordinator: countByTitle('coordinator'),
            technician: countByTitle('technician'),
            operator: countByTitle('operator'),
            clerk: countByTitle('clerk'),
            trainee: countByTitle('trainee'),
            intern: countByTitle('intern'),
            engineer: countByTitle('engineer'),
            staff: counts.staff,
            idl: counts.idl,
            dl: counts.dl,
            total: nodes.length
        };
    }, [nodes]);

    // Order: High level to Low level
    // Director -> Manager -> Supervisor -> Shift Leader -> Line Leader -> Engineer -> Specialist -> Coordinator -> Technician -> Operator -> WH Keeper -> Clerk -> Trainee -> Intern
    const titleCards: CardInfo[] = [
        { title: 'Director', count: stats.director, filterType: 'title', filterValue: 'director' },
        { title: 'Manager', count: stats.manager, filterType: 'title', filterValue: 'manager' },
        { title: 'Supervisor', count: stats.supervisor, filterType: 'title', filterValue: 'supervisor' },
        { title: 'Shift Leader', count: stats.shiftLeader, filterType: 'title', filterValue: 'shift leader' },
        { title: 'Leader', count: stats.leader, filterType: 'title', filterValue: 'leader' },
        { title: 'Engineer', count: stats.engineer, filterType: 'title', filterValue: 'engineer' },
        { title: 'Specialist', count: stats.specialist, filterType: 'title', filterValue: 'specialist' },
        { title: 'Coordinator', count: stats.coordinator, filterType: 'title', filterValue: 'coordinator' },
        { title: 'Technician', count: stats.technician, filterType: 'title', filterValue: 'technician' },
        { title: 'Operator', count: stats.operator, filterType: 'title', filterValue: 'operator' },
        { title: 'WH Keeper', count: stats.warehouseKeeper, filterType: 'title', filterValue: 'warehouse keeper' },
        { title: 'Clerk', count: stats.clerk, filterType: 'title', filterValue: 'clerk' },
        { title: 'Trainee', count: stats.trainee, filterType: 'title', filterValue: 'trainee' },
        { title: 'Intern', count: stats.intern, filterType: 'title', filterValue: 'intern' }
    ];

    // Show cards: Use the predefined hierarchical order.
    const visibleCards: CardInfo[] = useMemo(() => {
        // Just filter out zero counts if needed, but maintain order.
        let sorted = [...titleCards];

        // If a filter is active, or if we have significantly fewer total employees, hide zero counts
        if (activeFilter?.type !== 'all' || isFiltered) {
            sorted = sorted.filter(c => c.count > 0);
        }

        return sorted;
    }, [titleCards, activeFilter, isFiltered]);

    if (error) {
        return (
            <div className={className}>
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg text-sm">
                    Error loading data
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {visibleCards.map((card, index) => (
                <MetricCard
                    key={index}
                    label={card.title}
                    value={card.count}
                    subtitle="Employees"
                    icon={<RoleIcon title={card.title} />}
                    loading={loading}
                    onClick={() => onFilterChange?.({
                        type: card.filterType,
                        value: card.filterValue,
                        label: card.label || card.title
                    })}
                    active={
                        (card.filterType === 'all' && activeFilter?.type === 'all') ||
                        (activeFilter?.type === card.filterType && activeFilter?.value === card.filterValue)
                    }
                />
            ))}
        </div>
    );
};

export default StatsCards;
