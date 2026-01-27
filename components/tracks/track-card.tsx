// components/tracks/track-card.tsx

"use client"

import Image from "next/image"
import { Play, Heart, MessageCircle, TrendingUp, TrendingDown, Plus } from "lucide-react"
import { toast } from "sonner"
import { usePlayerStore, type Track } from "@/lib/store/player-store"
import { useState } from "react"

interface TrackCardProps {
  track: Track & {
    playCount: number
    votes?: {
      ups: number
      downs: number
    }
    _count?: {
      comments: number
    }
  }
  onVote?: (trackId: string, type: "UP" | "DOWN") => void
  onLike?: (trackId: string) => void
  userVote?: "UP" | "DOWN" | null
  isLiked?: boolean
}

export function TrackCard({ track, onVote, onLike, userVote, isLiked }: TrackCardProps) {
  const { setCurrentTrack, setQueue, play, currentTrack, activeJamId, isHost } = usePlayerStore()
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentTrack = currentTrack?.id === track.id

  const handlePlay = () => {
    setCurrentTrack(track)
    setQueue([track])
    play()
  }

  const handleAddToJam = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!activeJamId) return

    try {
      const res = await fetch(`/api/jams/${activeJamId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      })

      if (!res.ok) throw new Error("Failed to add to queue")
      toast.success("Added to jam queue!")
    } catch (error) {
      toast.error("Failed to add to jam")
    }
  }

  const voteScore = (track.votes?.ups || 0) - (track.votes?.downs || 0)

  return (
    <div
      className="group relative rounded-lg bg-card p-3 md:p-4 transition-all hover:bg-accent cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      {/* Cover Image */}
      <div className="relative aspect-square mb-2 md:mb-3 overflow-hidden rounded-md bg-muted">
        <Image
          src={track.coverUrl ? `/api/stream/image/${track.coverUrl}` : "/default-cover.jpg"}
          alt={track.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />

        {/* Play Button Overlay */}
        {(isHovered || isCurrentTrack) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
            <button
              onClick={handlePlay}
              className="bg-primary-500 hover:bg-primary-600 rounded-full p-4 transition-transform hover:scale-110"
            >
              <Play className="h-6 w-6 text-white fill-white" />
            </button>
            {activeJamId && isHost && (
              <button
                onClick={handleAddToJam}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-4 transition-transform hover:scale-110 border border-white/20"
                title="Add to Jam Queue"
              >
                <Plus className="h-6 w-6 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="space-y-0.5 md:space-y-1 mb-2 md:mb-3">
        <h3 className="font-semibold truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {track.creator.username}
        </p>
        <p className="text-xs text-muted-foreground">{track.genre}</p>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
          {/* Love (Heart) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike?.(track.id)
            }}
            className={`transition-all ${
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* UP Votes */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote?.(track.id, "UP")
              }}
              className={`transition-colors ${
                userVote === "UP" ? "text-primary-500" : "text-muted-foreground hover:text-primary-500"
              }`}
            >
              <TrendingUp className={`h-4 w-4 ${userVote === "UP" ? "fill-current" : ""}`} />
            </button>
            <span className={`text-xs font-medium ${userVote === "UP" ? "text-primary-500" : "text-muted-foreground"}`}>
              {track.votes?.ups || 0}
            </span>
          </div>

          {/* DOWN Votes */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote?.(track.id, "DOWN")
              }}
              className={`transition-colors ${
                userVote === "DOWN" ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <TrendingDown className={`h-4 w-4 ${userVote === "DOWN" ? "fill-current" : ""}`} />
            </button>
            <span className={`text-xs font-medium ${userVote === "DOWN" ? "text-red-500" : "text-muted-foreground"}`}>
              {track.votes?.downs || 0}
            </span>
          </div>

          {/* Comments */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{track._count?.comments || 0}</span>
          </div>
          
          {/* Play Count */}
          <div className="flex items-center gap-1 text-muted-foreground ml-auto md:ml-0">
            <span className="text-[10px] md:text-xs">{track.playCount.toLocaleString()} plays</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}