import { PulsingRing } from '@/components/Spinner';

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <PulsingRing />
                <p className="text-sm text-gray-500 animate-pulse">Đang tải sơ đồ tổ chức...</p>
            </div>
        </div>
    );
}
