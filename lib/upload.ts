// lib/upload.ts

import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// PENTING: Simpan di folder PRIVATE (bukan public)
export async function saveFile(
  file: File,
  folder: "audio" | "images"
): Promise<string> {
  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = path.extname(file.name)
    const filename = `${timestamp}-${randomString}${extension}`

    // Create directory OUTSIDE public folder (private storage)
    const uploadDir = path.join(process.cwd(), "storage", folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return filename only (bukan full path)
    // Nanti akan di-stream lewat API
    return filename
  } catch (error) {
    console.error("Error saving file:", error)
    throw new Error("Failed to save file")
  }
}

export function validateAudioFile(file: File): boolean {
  const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"]
  const maxSize = 50 * 1024 * 1024 // 50MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only MP3, WAV, and OGG are allowed.")
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 50MB.")
  }

  return true
}

export function validateImageFile(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.")
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 5MB.")
  }

  return true
}

// Helper untuk get file path dari storage
export function getFilePath(filename: string, folder: "audio" | "images"): string {
  return path.join(process.cwd(), "storage", folder, filename)
}