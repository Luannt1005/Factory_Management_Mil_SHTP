"use client";

import { useState } from "react";
import {
    PhotoIcon,
    TableCellsIcon
} from "@heroicons/react/24/outline";
import { headcountApi } from "@/features/headcount/services/headcountApi";
import { ImportExcelResult } from "@/types/headcount.types";
import { ExcelDataUploadCard } from "@/features/headcount/components/ExcelDataUploadCard";
import { ImageBatchUploadCard, ImageUploadLog } from "@/features/headcount/components/ImageBatchUploadCard";

type ImportTab = 'excel' | 'images';

interface DataImportProps {
    mode?: 'excel' | 'images' | 'both';
}

export default function DataImport({ mode = 'both' }: DataImportProps) {
    const [activeTab, setActiveTab] = useState<ImportTab>(mode === 'excel' ? 'excel' : mode === 'images' ? 'images' : 'excel');

    // Excel State
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportExcelResult | null>(null);

    // Image State
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imageLogs, setImageLogs] = useState<ImageUploadLog[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // --- Excel Handlers ---
    const handleFileChange = (selectedFile: File | null) => {
        if (selectedFile && (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls"))) {
            setFile(selectedFile);
            setError(null);
            setSuccess(null);
            setImportResult(null);
        } else {
            setError("Please select a valid Excel file (.xlsx)");
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            const data = await headcountApi.importExcel(file);

            setSuccess("Import successful!");
            setImportResult(data);
            setFile(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Import failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // --- Image Handlers ---
    const handleImageFilesChange = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

        // Initial validation logs
        const initialLogs = newFiles.map(f => {
            // Updated Regex: Match all digits including leading zeros (e.g., 000818)
            const match = f.name.match(/^(\d+)/);
            const isValidName = !!match;

            return {
                name: f.name,
                status: isValidName ? 'pending' as const : 'error' as const,
                message: isValidName
                    ? `Ready (ID: ${match ? match[1] : ''})`
                    : 'Invalid format. Name must start with Employee ID.'
            };
        });

        setImageFiles(newFiles);
        setImageLogs(initialLogs);
    };

    const processAndUploadImage = async (file: File, index: number) => {
        return new Promise<void>(async (resolve) => {
            // Extract ID from filename again
            const match = file.name.match(/^(\d+)/);

            // Re-validate just in case
            if (!match) {
                setImageLogs(prev => {
                    const newLogs = [...prev];
                    newLogs[index] = { ...newLogs[index], status: 'error', message: 'Invalid ID format' };
                    return newLogs;
                });
                resolve();
                return;
            }

            // Normalize ID: Remove leading zeros to match the API (e.g., "000818" -> "818")
            const employeeId = match[1].replace(/^0+/, '') || '0';

            try {
                // 1. Resize and Convert to WebP
                const imageBitmap = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) throw new Error("Canvas context failed");

                canvas.width = 225;
                canvas.height = 300;

                // Draw image containing (cover or contain? User didn't specify, but usually 'contain' or 'fill' for ID photos. 
                // Given fixed size 225x300, let's assume simple drawImage to fill, possibly stretching if ratio off, 
                // or better: preserve aspect ratio and center crop (cover).
                // For simplicity and standard ID photo requirements, let's stretch to fit (simple draw) as it guarantees 225x300. 
                // OR better: Draw Cover.
                // Let's implement 'Cover' style to avoid distortion.

                const ratio = Math.max(225 / imageBitmap.width, 300 / imageBitmap.height);
                const centerShift_x = (225 - imageBitmap.width * ratio) / 2;
                const centerShift_y = (300 - imageBitmap.height * ratio) / 2;

                ctx.drawImage(
                    imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
                    centerShift_x, centerShift_y, imageBitmap.width * ratio, imageBitmap.height * ratio
                );

                // Convert to Blob
                const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.9));
                if (!blob) throw new Error("WebP conversion failed");

                // 2. Upload to Supabase
                // Bucket: 'employee_images'
                // Filename: ID.webp
                const fileName = `${employeeId}.webp`;

                // 2. Upload via API (to bypass RLS)
                await headcountApi.uploadEmployeeImage(blob, fileName);

                setImageLogs(prev => {
                    const newLogs = [...prev];
                    newLogs[index] = { ...newLogs[index], status: 'success', message: 'Uploaded' };
                    return newLogs;
                });

            } catch (err: unknown) {
                console.error(err);
                const message = err instanceof Error ? err.message : "Upload failed";
                setImageLogs(prev => {
                    const newLogs = [...prev];
                    newLogs[index] = { ...newLogs[index], status: 'error', message };
                    return newLogs;
                });
            } finally {
                resolve();
            }
        });
    };

    const handleBatchUpload = async () => {
        setUploadingImages(true);
        const validFiles = imageFiles.map((f, i) => ({ file: f, index: i }))
            .filter(({ index }) => imageLogs[index].status !== 'error');

        // Process sequentially or limited parallel to avoid browser hanging
        for (const { file, index } of validFiles) {
            setImageLogs(prev => {
                const newLogs = [...prev];
                newLogs[index] = { ...newLogs[index], message: 'Processing...' };
                return newLogs;
            });
            await processAndUploadImage(file, index);
        }
        setUploadingImages(false);
    };

    return (
        <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-6">

            {/* Tabs */}
            {mode === 'both' && (
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'excel'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <TableCellsIcon className="w-5 h-5" />
                        Excel Data
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'images'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <PhotoIcon className="w-5 h-5" />
                        Employee Images
                    </button>
                </div>
            )}

            {/* EXCEL TAB */}
            {activeTab === 'excel' && (
                <ExcelDataUploadCard
                    file={file}
                    loading={loading}
                    error={error}
                    success={success}
                    importResult={importResult}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                    onClearFile={() => setFile(null)}
                />
            )}

            {/* IMAGE TAB */}
            {activeTab === 'images' && (
                <ImageBatchUploadCard
                    imageFiles={imageFiles}
                    imageLogs={imageLogs}
                    uploadingImages={uploadingImages}
                    onFilesChange={handleImageFilesChange}
                    onBatchUpload={handleBatchUpload}
                    onClearAll={() => {
                        setImageFiles([]);
                        setImageLogs([]);
                    }}
                />
            )}
        </div>
    );
}
