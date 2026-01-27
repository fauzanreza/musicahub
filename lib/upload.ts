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
  // Support for various audio formats
  const allowedTypes = [
    "audio/mpeg",           // MP3
    "audio/mp3",            // MP3 (alternative)
    "audio/wav",            // WAV
    "audio/wave",           // WAV (alternative)
    "audio/x-wav",          // WAV (alternative)
    "audio/ogg",            // OGG
    "audio/flac",           // FLAC
    "audio/x-flac",         // FLAC (alternative)
    "audio/mp4",            // M4A
    "audio/x-m4a",          // M4A (alternative)
    "audio/aac",            // AAC
    "audio/aacp",           // AAC+ (alternative)
    "audio/opus",           // OPUS
    "audio/webm",           // WEBM
  ]
  
  // Also check file extension as fallback (some browsers don't set MIME type correctly)
  const allowedExtensions = [
    ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".opus", ".webm"
  ]
  
  const maxSize = 100 * 1024 * 1024 // 100MB (increased for FLAC files which are larger)

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

  if (!isValidType) {
    throw new Error("Invalid file type. Supported formats: MP3, WAV, OGG, FLAC, M4A, AAC, OPUS, WEBM")
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 100MB.")
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