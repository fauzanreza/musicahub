// app/api/upload/audio/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile, validateAudioFile } from "@/lib/upload"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file
    validateAudioFile(file)

    // Save file dan dapat filename (bukan URL)
    const filename = await saveFile(file, "audio")

    // Return filename yang akan digunakan untuk streaming
    return NextResponse.json({ filename }, { status: 200 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}