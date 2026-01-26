"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Music, Image as ImageIcon, X, CheckCircle, AlertCircle, FileAudio } from "lucide-react"
import { toast } from "sonner"

const GENRES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Electronic",
  "Jazz",
  "Classical",
  "R&B",
  "Country",
  "Indie",
  "Alternative",
]

interface MassUploadFile {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
}

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"single" | "mass">("single")
  
  // Single Upload Refs & State
  const audioInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [singleData, setSingleData] = useState({ title: "", genre: "" })
  const [singleAudio, setSingleAudio] = useState<File | null>(null)
  const [singleCover, setSingleCover] = useState<File | null>(null)
  const [singleCoverPreview, setSingleCoverPreview] = useState<string>("")
  const [singleProgress, setSingleProgress] = useState({ audio: 0, cover: 0 })

  // Mass Upload Refs & State
  const massAudioInputRef = useRef<HTMLInputElement>(null)
  const massImageInputRef = useRef<HTMLInputElement>(null)
  const [massGenre, setMassGenre] = useState("")
  const [massFiles, setMassFiles] = useState<MassUploadFile[]>([])
  const [massCover, setMassCover] = useState<File | null>(null)
  const [massCoverPreview, setMassCoverPreview] = useState<string>("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Helper Functions ---

  const uploadFile = async (
    file: File,
    endpoint: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress)
        }
      })
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response.filename)
        } else {
          reject(new Error("Upload failed"))
        }
      })
      xhr.addEventListener("error", () => reject(new Error("Upload failed")))
      xhr.open("POST", endpoint)
      xhr.send(formData)
    })
  }

  const validateAudio = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error(`Invalid file type: ${file.name}`)
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File too large: ${file.name} (Max 50MB)`)
      return false
    }
    return true
  }

  const validateImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be less than 5MB")
      return false
    }
    return true
  }

  // --- Single Upload Handlers ---

  const handleSingleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateAudio(file)) setSingleAudio(file)
  }

  const handleSingleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateImage(file)) {
      setSingleCover(file)
      const reader = new FileReader()
      reader.onloadend = () => setSingleCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!singleData.title || !singleData.genre || !singleAudio) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const audioFilename = await uploadFile(singleAudio, "/api/upload/audio", (p) => 
        setSingleProgress(prev => ({ ...prev, audio: p }))
      )

      let coverFilename = ""
      if (singleCover) {
        coverFilename = await uploadFile(singleCover, "/api/upload/image", (p) => 
          setSingleProgress(prev => ({ ...prev, cover: p }))
        )
      }

      await createTrack({
        title: singleData.title,
        genre: singleData.genre,
        audioUrl: audioFilename,
        coverUrl: coverFilename || null,
      })

      toast.success("Track uploaded successfully!")
      router.push("/")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload track")
    } finally {
      setIsSubmitting(false)
      setSingleProgress({ audio: 0, cover: 0 })
    }
  }

  // --- Mass Upload Handlers ---

  const handleMassAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(validateAudio).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "pending" as const,
      progress: 0
    }))
    setMassFiles(prev => [...prev, ...validFiles])
  }

  const handleMassCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateImage(file)) {
      setMassCover(file)
      const reader = new FileReader()
      reader.onloadend = () => setMassCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleMassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!massGenre || massFiles.length === 0) {
      toast.error("Please select a genre and at least one audio file")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload Cover Image (Once)
      let coverFilename = ""
      if (massCover) {
        coverFilename = await uploadFile(massCover, "/api/upload/image", () => {})
      }

      // 2. Upload Each Track
      let hasError = false
      for (let i = 0; i < massFiles.length; i++) {
        const fileItem = massFiles[i]
        if (fileItem.status === "success") continue // Skip already uploaded

        setMassFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f))

        try {
          const audioFilename = await uploadFile(fileItem.file, "/api/upload/audio", (p) => {
            setMassFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress: p } : f))
          })

          await createTrack({
            title: fileItem.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            genre: massGenre,
            audioUrl: audioFilename,
            coverUrl: coverFilename || null,
          })

          setMassFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "success", progress: 100 } : f))
        } catch (error) {
          console.error(error)
          hasError = true
          setMassFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error" } : f))
        }
      }
      
      if (!hasError) {
        toast.success("All tracks uploaded successfully!")
        router.push("/")
      } else {
        toast.error("Some uploads failed. Please check the list.")
      }

    } catch (error) {
      console.error(error)
      toast.error("An error occurred during mass upload")
    } finally {
      setIsSubmitting(false)
    }
  }

  const createTrack = async (data: any) => {
    const sessionRes = await fetch("/api/auth/session")
    const session = await sessionRes.json()
    
    if (!session?.user?.id) throw new Error("Unauthorized")
    const userId = session.user.id

    const res = await fetch("/api/tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, creatorId: userId, duration: 0 }),
    })

    if (!res.ok) throw new Error("Failed to create track")
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Your Music</h1>
          <p className="text-muted-foreground">Share your creations with the MusicaHub community</p>
        </div>

        {/* Chrome-like Tabs */}
        <div className="flex items-end gap-2 px-4 border-b border-border">
          <button
            onClick={() => setMode("single")}
            className={`px-6 py-3 rounded-t-xl text-sm font-medium transition-all relative top-[1px] ${
              mode === "single"
                ? "bg-background border border-border border-b-background text-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
            }`}
          >
            Single Upload
          </button>
          <button
            onClick={() => setMode("mass")}
            className={`px-6 py-3 rounded-t-xl text-sm font-medium transition-all relative top-[1px] ${
              mode === "mass"
                ? "bg-background border border-border border-b-background text-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
            }`}
          >
            Mass Upload
          </button>
        </div>

        <div className="bg-background border border-border rounded-b-xl rounded-tr-xl p-6 shadow-sm">
          {mode === "single" ? (
            /* --- SINGLE UPLOAD FORM --- */
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Track Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={singleData.title}
                  onChange={(e) => setSingleData({ ...singleData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Enter track title"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre <span className="text-red-500">*</span></label>
                <select
                  value={singleData.genre}
                  onChange={(e) => setSingleData({ ...singleData, genre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a genre</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Single Audio Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Audio File <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {singleAudio ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Music className="h-8 w-8 text-primary-500" />
                        <div>
                          <p className="font-medium">{singleAudio.name}</p>
                          <p className="text-sm text-muted-foreground">{(singleAudio.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setSingleAudio(null)} disabled={isSubmitting} className="p-2 hover:bg-accent rounded-full">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Music className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                        disabled={isSubmitting}
                      >
                        Choose Audio File
                      </button>
                      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleSingleAudioChange} className="hidden" />
                    </div>
                  )}
                  {isSubmitting && singleProgress.audio > 0 && (
                     <div className="mt-4 w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${singleProgress.audio}%` }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Single Cover Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {singleCover ? (
                    <div className="flex items-center gap-4">
                      <img src={singleCoverPreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{singleCover.name}</p>
                        <p className="text-sm text-muted-foreground">{(singleCover.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={() => { setSingleCover(null); setSingleCoverPreview("") }} disabled={isSubmitting} className="p-2 hover:bg-accent rounded-full">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="bg-secondary hover:bg-accent px-4 py-2 rounded-lg transition-colors"
                        disabled={isSubmitting}
                      >
                        Choose Image
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleSingleCoverChange} className="hidden" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !singleAudio}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Uploading..." : <><Upload className="h-5 w-5" /> Upload Track</>}
              </button>
            </form>
          ) : (
            /* --- MASS UPLOAD FORM --- */
            <form onSubmit={handleMassSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Album Genre <span className="text-red-500">*</span></label>
                  <select
                    value={massGenre}
                    onChange={(e) => setMassGenre(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select a genre for all tracks</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Album Cover (Optional)</label>
                  <div className="flex items-center gap-4 border rounded-lg p-2">
                    {massCover ? (
                      <>
                        <img src={massCoverPreview} alt="Preview" className="w-10 h-10 rounded object-cover" />
                        <span className="text-sm truncate flex-1">{massCover.name}</span>
                        <button type="button" onClick={() => { setMassCover(null); setMassCoverPreview("") }} className="p-1 hover:bg-accent rounded-full">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => massImageInputRef.current?.click()}
                        className="text-sm text-primary-500 hover:underline px-2"
                      >
                        Select Image
                      </button>
                    )}
                    <input ref={massImageInputRef} type="file" accept="image/*" onChange={handleMassCoverChange} className="hidden" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Applies to all tracks if provided.</p>
                </div>
              </div>

              {/* Mass Audio Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Audio Files <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => massAudioInputRef.current?.click()}>
                  <FileAudio className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Click to select multiple songs</p>
                  <p className="text-sm text-muted-foreground">or drag and drop here</p>
                  <input
                    ref={massAudioInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleMassAudioChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* File List */}
              {massFiles.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {massFiles.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                      <div className="h-8 w-8 flex items-center justify-center bg-primary-500/10 rounded text-primary-500 font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          {item.status === "uploading" && <span>• {Math.round(item.progress)}%</span>}
                        </div>
                        {item.status === "uploading" && (
                          <div className="h-1 w-full bg-secondary rounded-full mt-1">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}
                      </div>
                      <div>
                        {item.status === "pending" && <button type="button" onClick={() => setMassFiles(prev => prev.filter(f => f.id !== item.id))} className="p-1 hover:bg-accent rounded"><X className="h-4 w-4 text-muted-foreground" /></button>}
                        {item.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {item.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || massFiles.length === 0}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Uploading..." : <><Upload className="h-5 w-5" /> Upload All Tracks</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}