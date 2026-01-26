// app/api/stream/image/[filename]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { getFilePath } from "@/lib/upload"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Validasi filename untuk prevent path traversal attack
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    // Get file path
    const filePath = getFilePath(filename, "images")

    // Read file
    let buffer
    try {
      buffer = await readFile(filePath)
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Detect content type dari extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = "image/jpeg"
    if (ext === ".png") contentType = "image/png"
    if (ext === ".webp") contentType = "image/webp"
    if (ext === ".gif") contentType = "image/gif"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        // PENTING: Prevent download
        "Content-Disposition": "inline",
      },
    })
  } catch (error) {
    console.error("Stream error:", error)
    return NextResponse.json(
      { error: "Failed to stream image" },
      { status: 500 }
    )
  }
}