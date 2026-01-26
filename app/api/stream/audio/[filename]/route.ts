// app/api/stream/audio/[filename]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createReadStream, statSync } from "fs"
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
    const filePath = getFilePath(filename, "audio")

    // Check if file exists
    let stat
    try {
      stat = statSync(filePath)
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get range dari request header (untuk streaming)
    const range = request.headers.get("range")

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunksize = end - start + 1

      // Create read stream untuk chunk
      const file = createReadStream(filePath, { start, end })

      // Convert stream to array buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of file) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      // Return partial content dengan proper headers
      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          // PENTING: Prevent download
          "Content-Disposition": "inline",
        },
      })
    } else {
      // Full file request (tanpa range)
      const file = createReadStream(filePath)

      const chunks: Uint8Array[] = []
      for await (const chunk of file) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Length": stat.size.toString(),
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          // PENTING: Prevent download
          "Content-Disposition": "inline",
        },
      })
    }
  } catch (error) {
    console.error("Stream error:", error)
    return NextResponse.json(
      { error: "Failed to stream audio" },
      { status: 500 }
    )
  }
}