'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

interface CardQrCodeProps {
    value: string;
    className?: string;
}

/**
 * Vector QR code (one SVG path), so printed badges stay razor-sharp at any DPI.
 * Error correction "M" keeps the code readable even with small print / lamination glare.
 */
export default function CardQrCode({ value, className }: CardQrCodeProps) {
    const qr = useMemo(() => {
        if (!value) return null;
        try {
            const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
            const size = modules.size;
            let path = '';
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (modules.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
                }
            }
            return { size, path };
        } catch {
            return null;
        }
    }, [value]);

    if (!qr) {
        return (
            <div className={`flex items-center justify-center text-center text-[1.8mm] font-semibold text-gray-400 ${className ?? ''}`}>
                No QR data
            </div>
        );
    }

    return (
        <svg
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            className={className}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code: ${value}`}
        >
            <path d={qr.path} fill="#000" />
        </svg>
    );
}
