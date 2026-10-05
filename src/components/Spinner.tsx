'use client';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'white' | 'gray';
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
};

const colorClasses = {
    primary: 'border-gray-200 border-t-mwk',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-100 border-t-gray-500',
};

export default function Spinner({
    size = 'md',
    color = 'primary',
    className = ''
}: SpinnerProps) {
    return (
        <div
            className={`
                ${sizeClasses[size]} 
                ${colorClasses[color]} 
                rounded-full animate-spin
                ${className}
            `}
        />
    );
}

// Cute bouncing dots spinner
export function BouncingDots({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="w-2 h-2 bg-mwk rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-mwk rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-mwk rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );
}

// Pulsing ring spinner
export function PulsingRing({ className = '' }: { className?: string }) {
    return (
        <div className={`relative w-10 h-10 ${className}`}>
            <div className="absolute inset-0 border-4 border-mwk/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-mwk rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-b-[#ff6b6b] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
    );
}

// Skeleton loader for content
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`bg-gray-200 rounded animate-pulse ${className}`}
            style={style}
        />
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Skeleton className="h-4 w-1/3 mb-3" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 w-1/4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            ))}
        </div>
    );
}

// Chart skeleton
export function ChartSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Skeleton className="h-4 w-1/4 mb-4" />
            <div className="flex items-end gap-2 h-40">
                {[40, 70, 55, 80, 65, 90, 50].map((h, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
