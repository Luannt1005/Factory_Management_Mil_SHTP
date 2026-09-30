'use client';

import React, { useState, useRef } from 'react';
import {
    CloudArrowUpIcon,
    DocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ImportExcelResult } from '@/types/headcount.types';

interface ExcelDataUploadCardProps {
    file: File | null;
    loading: boolean;
    error: string | null;
    success: string | null;
    importResult: ImportExcelResult | null;
    onFileChange: (file: File | null) => void;
    onUpload: () => void;
    onClearFile: () => void;
}

export const ExcelDataUploadCard: React.FC<ExcelDataUploadCardProps> = ({
    file,
    loading,
    error,
    success,
    importResult,
    onFileChange,
    onUpload,
    onClearFile,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            onFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto flex flex-col items-center">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Import Organization Data</h2>
                <p className="text-sm text-gray-500 mt-1">Upload your Excel file to update the database</p>
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    w-full relative group cursor-pointer
                    border-2 border-dashed rounded-xl p-8 transition-all duration-200
                    flex flex-col items-center justify-center gap-4
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }
                `}
            >
                <div
                    className={`
                    p-4 rounded-full transition-colors duration-200
                    ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}
                `}
                >
                    <CloudArrowUpIcon className="w-8 h-8" />
                </div>

                <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 border-b-2 border-transparent group-hover:border-blue-500 inline-block">
                        Click to upload Excel
                    </p>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                />
            </div>

            {/* Status Area Excel */}
            <div className="mt-6 space-y-4 w-full">
                {file && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <DocumentIcon className="w-5 h-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                            <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={onClearFile} className="text-blue-400 hover:text-blue-600">
                            ×
                        </button>
                    </div>
                )}
                {error && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                            <p className="font-medium">{success}</p>
                            {importResult?.total !== undefined && (
                                <p className="mt-1">Processed {importResult.total} records.</p>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={onUpload}
                    disabled={!file || loading}
                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );
};

export default ExcelDataUploadCard;
