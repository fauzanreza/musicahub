"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, Search, Music, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Track {
  id: string
  title: string
  coverUrl: string | null
  genre: string
  creator: {
    username: string
  }
  duration: number
}

interface AddTrackModalProps {
  isOpen: boolean
  onClose: () => void
  jamId: string
  onTrackAdded: () => void
}

export function AddTrackModal({ isOpen, onClose, jamId, onTrackAdded }: AddTrackModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null)

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["tracks", "search", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set("q", searchQuery)
      const res = await fetch(`/api/tracks?${params}`)
      if (!res.ok) throw new Error("Failed to fetch tracks")
      const data = await res.json()
      return data.tracks || data
    },
    enabled: isOpen,
  })

  const handleAddTrack = async (trackId: string) => {
    setAddingTrackId(trackId)
    try {
      const res = await fetch(`/api/jams/${jamId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (!res.ok) throw new Error("Failed to add track")

      toast.success("Track added to queue!")
      onTrackAdded()
    } catch (error) {
      toast.error("Failed to add track to queue")
    } finally {
      setAddingTrackId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-8 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary-500" />
              </div>
              Add to Queue
            </h2>
            <p className="text-muted-foreground text-sm mt-1 font-medium">Search and add tracks to the party</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5 md:p-8 border-b border-border bg-card">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks..."
              className="w-full pl-14 pr-6 py-3.5 md:py-4 rounded-2xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-sm md:text-base"
            />
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-muted-foreground font-bold text-sm tracking-widest">FINDING TRACKS...</p>
            </div>
          ) : tracks && tracks.length > 0 ? (
            tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 rounded-3xl bg-muted/40 hover:bg-muted border border-border transition-all group"
              >
                <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-xl">
                  {track.coverUrl ? (
                    <Image
                      src={`/api/stream/image/${track.coverUrl}`}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Music className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-foreground truncate tracking-tight">{track.title}</h3>
                  <p className="text-sm text-muted-foreground font-bold truncate mt-0.5">
                    {track.creator.username} <span className="text-muted-foreground/30 mx-1">•</span> {track.genre}
                  </p>
                </div>
                <button
                  onClick={() => handleAddTrack(track.id)}
                  disabled={addingTrackId === track.id}
                  className="h-12 w-12 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary-500/20 hover:scale-110 active:scale-95"
                >
                  {addingTrackId === track.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="h-6 w-6" />
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Music className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-foreground font-black text-lg">No tracks found</h3>
              <p className="text-muted-foreground font-medium max-w-[250px] mt-2">
                {searchQuery ? "Try searching for something else" : "Start typing to find your favorite tracks"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
