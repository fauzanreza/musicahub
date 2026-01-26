// app/api/upload/image/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveFile, validateImageFile } from "@/lib/upload"

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
    validateImageFile(file)

    // Save file dan dapat filename
    const filename = await saveFile(file, "images")

    // Return filename
    return NextResponse.json({ filename }, { status: 200 })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}