'use client';

import React, { useState, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

export interface ImageUploadLog {
    name: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
}

interface ImageBatchUploadCardProps {
    imageFiles: File[];
    imageLogs: ImageUploadLog[];
    uploadingImages: boolean;
    onFilesChange: (files: FileList | null) => void;
    onBatchUpload: () => void;
    onClearAll: () => void;
}

export const ImageBatchUploadCard: React.FC<ImageBatchUploadCardProps> = ({
    imageFiles,
    imageLogs,
    uploadingImages,
    onFilesChange,
    onBatchUpload,
    onClearAll,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        onFilesChange(e.dataTransfer.files);
    };

    const validPendingCount = imageFiles.filter(
        (_, i) => imageLogs[i]?.status !== 'error' && imageLogs[i]?.status !== 'success'
    ).length;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Import Employee Photos</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Files must be named with Employee ID (e.g. <code>818.jpg</code>).
                        <br />
                        Images will be resized to 225x300 and converted to WebP.
                    </p>
                </div>

                {imageFiles.length === 0 ? (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => imageInputRef.current?.click()}
                        className={`
                            w-full h-48 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors
                            ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'}
                        `}
                    >
                        <div
                            className={`p-3 rounded-full ${
                                isDragging ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600'
                            }`}
                        >
                            <PhotoIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Click to select images</p>
                        <p className="text-xs text-gray-500">or drag and drop here</p>
                        <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP</p>
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col min-h-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{imageFiles.length} files selected</span>
                            <button
                                onClick={onClearAll}
                                disabled={uploadingImages}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {imageLogs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-2 bg-white rounded border border-gray-100 shadow-sm"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                            log.status === 'success'
                                                ? 'bg-green-500'
                                                : log.status === 'error'
                                                    ? 'bg-red-500'
                                                    : 'bg-gray-300'
                                        }`}
                                    />
                                    <span className="text-sm font-mono text-gray-700 flex-1 truncate">{log.name}</span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                            log.status === 'success'
                                                ? 'bg-green-100 text-green-700'
                                                : log.status === 'error'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full mt-4">
                    <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => onFilesChange(e.target.files)}
                        className="hidden"
                    />

                    {imageFiles.length > 0 && (
                        <button
                            onClick={onBatchUpload}
                            disabled={uploadingImages}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            {uploadingImages ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing {imageFiles.length} images...
                                </>
                            ) : (
                                `Upload ${validPendingCount} Valid Images`
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageBatchUploadCard;
