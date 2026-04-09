import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";

export async function GET(req: Request, props: { params: Promise<{ filename: string }> }) {
    const params = await props.params;
    const { filename } = params;

    try {
        const uploadDir = "D:\\Images emp\\uploads";
        const filePath = path.join(uploadDir, filename);

        // Basic security check: ensure no path traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return new NextResponse("Invalid filename", { status: 400 });
        }

        const fileBuffer = await fs.readFile(filePath);
        
        // Determine content type
        let contentType = "image/webp";
        if (filename.endsWith(".png")) contentType = "image/png";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (filename.endsWith(".svg")) contentType = "image/svg+xml";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"
            }
        });

    } catch (error) {
        console.error(`Error serving image ${filename}:`, error);
        return new NextResponse("Image not found", { status: 404 });
    }
}
