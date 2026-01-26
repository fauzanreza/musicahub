
"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Music, Heart, Edit2, Trash2, X, Loader2, Camera, Play } from "lucide-react"
import { toast } from "sonner"
import { usePlayerStore } from "@/lib/store/player-store"

interface Track {
  id: string
  title: string
  genre: string
  coverUrl: string | null
  audioUrl: string
  createdAt: Date
  _count: {
    votes: number
  }
  creator: {
    id: string
    username: string
    avatar: string | null
  }
}

interface TrackListProps {
  tracks: Track[]
  isOwner: boolean
}

export function TrackList({ tracks, isOwner }: TrackListProps) {
  const router = useRouter()
  const { setCurrentTrack, play } = usePlayerStore()
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    coverUrl: "" as string | null,
  })

  const handlePlay = (track: Track) => {
    setCurrentTrack(track)
    play()
  }

  const handleEdit = (track: Track) => {
    setEditingTrack(track)
    setFormData({
      title: track.title,
      genre: track.genre,
      coverUrl: track.coverUrl ? `/api/stream/image/${track.coverUrl}` : null,
    })
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadData = new FormData()
    uploadData.append("file", file)

    const toastId = toast.loading("Uploading cover...")

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setFormData(prev => ({ ...prev, coverUrl: `/api/stream/image/${data.filename}` }))
      toast.success("Cover uploaded", { id: toastId })
    } catch (error) {
      toast.error("Failed to upload cover", { id: toastId })
    }
  }

  const handleSave = async () => {
    if (!editingTrack) return

    setIsLoading(true)
    try {
      // Extract filename from URL if it's a full URL, otherwise keep it as is (though API expects filename usually, let's check)
      // The API expects just the filename for coverUrl if we look at how it's stored.
      // But wait, the upload endpoint returns { filename }.
      // The formData.coverUrl currently stores `/api/stream/image/${filename}`.
      // We need to extract just the filename to store in DB if that's how it's stored.
      // Let's check the schema. Track.coverUrl is String.
      // In `app/upload/page.tsx` (not visible but assuming), it likely stores just the filename.
      // Let's parse the filename from the URL.
      
      let coverUrlToSave = formData.coverUrl
      if (formData.coverUrl && formData.coverUrl.includes("/api/stream/image/")) {
        coverUrlToSave = formData.coverUrl.split("/api/stream/image/")[1]
      }

      const res = await fetch(`/api/tracks/${editingTrack.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          genre: formData.genre,
          coverUrl: coverUrlToSave,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update track")
      }

      toast.success("Track updated successfully")
      setEditingTrack(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingTrack || !confirm("Are you sure you want to delete this track? This action cannot be undone.")) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/tracks/${editingTrack.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete track")
      }

      toast.success("Track deleted successfully")
      setEditingTrack(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Music className="w-6 h-6 text-primary-500" />
        Uploaded Tracks
      </h2>

      {tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div 
              key={track.id}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group-hover:scale-105 transition-transform cursor-pointer" onClick={() => handlePlay(track)}>
                  <Image
                    src={track.coverUrl ? `/api/stream/image/${track.coverUrl}` : "/default-cover.jpg"}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate mb-1 cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handlePlay(track)}>{track.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {track._count.votes}
                    </span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
                      {track.genre}
                    </span>
                  </div>
                </div>
                {isOwner && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(track); }}
                    className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No tracks yet</h3>
          <p className="text-muted-foreground">This user hasn't uploaded any music yet.</p>
        </div>
      )}

      {/* Edit Track Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-background border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 pb-2 border-b border-white/5">
              <h2 className="text-xl font-bold">Edit Track</h2>
              <button onClick={() => setEditingTrack(null)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 group cursor-pointer rounded-xl overflow-hidden">
                  {formData.coverUrl ? (
                    <Image
                      src={formData.coverUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-500/10 flex items-center justify-center">
                      <Music className="w-10 h-10 text-primary-500" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Hip Hop">Hip Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Classical">Classical</option>
                  <option value="Indie">Indie</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-[2] bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
