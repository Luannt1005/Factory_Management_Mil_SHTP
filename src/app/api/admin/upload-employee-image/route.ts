export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { promises as fs, existsSync } from "fs";
import * as path from "path";
import * as os from "os";

const getUploadDir = (): string => {
    if (existsSync("D:\\Images emp\\uploads")) {
        return "D:\\Images emp\\uploads";
    }
    const desktopPath = path.join(os.homedir(), "Desktop", "uploads");
    if (existsSync(desktopPath)) {
        return desktopPath;
    }
    return path.join(process.cwd(), "uploads");
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;
        const filename = formData.get("filename") as string | null;

        if (!file || !filename) {
            return NextResponse.json(
                { success: false, error: "File and filename are required" },
                { status: 400 }
            );
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Ensure the directory exists
        const uploadDir = getUploadDir();
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        // Save file locally to external uploads directory
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            message: "Uploaded successfully",
            path: `/api/uploads/${filename}`
        });

    } catch (error: any) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Unknown server error" },
            { status: 500 }
        );
    }
}
