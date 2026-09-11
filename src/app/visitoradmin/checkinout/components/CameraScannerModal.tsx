'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (scannedText: string) => void;
}

export default function CameraScannerModal({ isOpen, onClose, onScan }: CameraScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [hasCamera, setHasCamera] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsDetecting(false);
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Check BarcodeDetector support
            if ('BarcodeDetector' in window) {
                const BarcodeDetectorClass = (window as any).BarcodeDetector;
                const detector = new BarcodeDetectorClass({ formats: ['qr_code', 'code_128', 'code_39'] });

                const detectFrame = async () => {
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes && barcodes.length > 0) {
                                const detectedValue = barcodes[0].rawValue;
                                if (detectedValue) {
                                    stopCamera();
                                    onScan(detectedValue);
                                    onClose();
                                    return;
                                }
                            }
                        } catch (e) {
                            // frame detection skip
                        }
                    }
                    animationFrameRef.current = requestAnimationFrame(detectFrame);
                };

                setIsDetecting(true);
                animationFrameRef.current = requestAnimationFrame(detectFrame);
            } else {
                setCameraError('Trình duyệt của bạn không hỗ trợ tính năng quét trực tiếp từ camera. Vui lòng sử dụng máy quét súng QR hoặc nhập mã ID vào ô tìm kiếm.');
            }
        } catch (err: any) {
            console.error('Camera access error:', err);
            setHasCamera(false);
            setCameraError(err?.message || 'Không thể truy cập camera. Vui lòng cấp quyền truy cập camera cho trang web.');
        }
    }, [onClose, onScan, stopCamera]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#1a1a1a] text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#db011c] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight">Camera QR Scanner</h3>
                            <p className="text-[11px] text-gray-400">Hướng camera vào mã QR để quét</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Video Viewfinder */}
                <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover" 
                        muted 
                        playsInline
                    />

                    {/* Scanning Aim Frame Overlay */}
                    {isDetecting && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-red-500 rounded-2xl relative shadow-2xl">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#db011c] -mt-1 -ml-1 rounded-tl"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#db011c] -mt-1 -mr-1 rounded-tr"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#db011c] -mb-1 -ml-1 rounded-bl"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#db011c] -mb-1 -mr-1 rounded-br"></div>
                                
                                {/* Scanning line animation */}
                                <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_red] absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                            </div>
                        </div>
                    )}

                    {cameraError && (
                        <div className="absolute inset-0 bg-black/85 p-6 flex flex-col items-center justify-center text-center text-white">
                            <span className="text-3xl mb-2">⚠️</span>
                            <p className="text-xs font-medium text-gray-300 mb-4">{cameraError}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white text-gray-900 rounded-lg text-xs font-bold"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                        Đặt mã QR trên điện thoại hoặc giấy của khách vào giữa khung hình.
                    </p>
                </div>
            </div>
        </div>
    );
}
