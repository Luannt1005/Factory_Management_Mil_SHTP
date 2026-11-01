export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { promises as fs, existsSync } from "fs";
import * as path from "path";
import * as os from "os";
import { findEmployeeRecord, readEmployeePhoto } from "@/lib/employees/source";

/** "Nguyen Thanh Luan" -> "NL" (accents removed so the SVG only holds A-Z) */
const getInitials = (name: string): string => {
    const words = name
        .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "D")
        .toUpperCase().split(/[^A-Z]+/).filter(Boolean);
    if (words.length === 0) return "";
    return words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
};

// Teams-style avatar colours: [background, text]
const AVATAR_COLORS: [string, string][] = [
    ["#0b4a8b", "#cfe4fa"], // blue
    ["#0e4f4c", "#b6e3df"], // teal
    ["#5c2e91", "#e3d4f5"], // purple
    ["#8a3b12", "#fbd9c5"], // orange
    ["#1f5f2b", "#c9ecd0"], // green
    ["#8f1c4a", "#f7d0df"], // magenta
    ["#7a5b00", "#f6e7b0"], // gold
    ["#3b4a8f", "#d6dcf7"], // indigo
    ["#00566b", "#c2e8f2"], // cyan
    ["#6b2f2f", "#f1d2d2"], // brown red
    ["#4b5563", "#e5e7eb"], // slate
    ["#5a1f7a", "#ead2f7"], // violet
];

/** Placeholder for employees without a photo: initials, colour picked from the emp id so it stays the same */
const initialsAvatar = (initials: string, seed: string): NextResponse => {
    const hash = [...seed].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const [background, text] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<rect width="200" height="200" fill="${background}"/>
<text x="100" y="100" dy="0.35em" text-anchor="middle" fill="${text}" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="68" font-weight="600">${initials}</text>
</svg>`;
    return new NextResponse(svg, {
        headers: {
            "Content-Type": "image/svg+xml",
            // Short cache: the person may get a photo later
            "Cache-Control": "public, max-age=300"
        }
    });
};

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

export async function GET(req: Request, props: { params: Promise<{ filename: string }> }) {
    const params = await props.params;
    const { filename } = params;

    // Employee photos ("<emp id>.webp") come from the employee master database first
    const empPhoto = filename.match(/^(\d{1,10})\.(webp|png|jpe?g)$/i);
    if (empPhoto) {
        try {
            const photo = await readEmployeePhoto(empPhoto[1]);
            if (photo) {
                return new NextResponse(new Uint8Array(photo.data), {
                    headers: {
                        "Content-Type": photo.contentType,
                        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"
                    }
                });
            }
        } catch (error) {
            console.error(`Employee photo lookup failed for ${filename}:`, error);
        }
    }

    // Otherwise (no photo in HR, other images): files in the upload folder
    try {
        const uploadDir = getUploadDir();
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
        // Employee with no photo anywhere: show their initials instead of a broken image
        if (empPhoto) {
            try {
                const employee = await findEmployeeRecord(empPhoto[1]);
                const initials = getInitials(employee?.full_name ?? "");
                if (initials) return initialsAvatar(initials, empPhoto[1].replace(/^0+/, ""));
            } catch (lookupError) {
                console.error(`Initials avatar failed for ${filename}:`, lookupError);
            }
        }
        console.error(`Error serving image ${filename}:`, error);
        return new NextResponse("Image not found", { status: 404 });
    }
}
