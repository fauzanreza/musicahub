// components/tracks/track-card.tsx

"use client"

import Image from "next/image"
import { Play, Heart, MessageCircle, TrendingUp, TrendingDown } from "lucide-react"
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
  userVote?: "UP" | "DOWN" | null
}

export function TrackCard({ track, onVote, userVote }: TrackCardProps) {
  const { setCurrentTrack, setQueue, play, currentTrack } = usePlayerStore()
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentTrack = currentTrack?.id === track.id

  const handlePlay = () => {
    setCurrentTrack(track)
    setQueue([track])
    play()
  }

  const voteScore = (track.votes?.ups || 0) - (track.votes?.downs || 0)

  return (
    <div
      className="group relative rounded-lg bg-card p-4 transition-all hover:bg-accent cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      {/* Cover Image */}
      <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-muted">
        <Image
          src={track.coverUrl ? `/api/stream/image/${track.coverUrl}` : "/default-cover.jpg"}
          alt={track.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />

        {/* Play Button Overlay */}
        {(isHovered || isCurrentTrack) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="bg-primary-500 hover:bg-primary-600 rounded-full p-4 transition-transform hover:scale-110"
            >
              <Play className="h-6 w-6 text-white fill-white" />
            </button>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="space-y-1 mb-3">
        <h3 className="font-semibold truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {track.creator.username}
        </p>
        <p className="text-xs text-muted-foreground">{track.genre}</p>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          {/* Vote Score */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote?.(track.id, "UP")
              }}
              className={`p-1 rounded transition-colors ${
                userVote === "UP"
                  ? "text-primary-500"
                  : "text-muted-foreground hover:text-primary-500"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
            <span className={voteScore > 0 ? "text-primary-500" : ""}>
              {voteScore}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote?.(track.id, "DOWN")
              }}
              className={`p-1 rounded transition-colors ${
                userVote === "DOWN"
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <TrendingDown className="h-4 w-4" />
            </button>
          </div>

          {/* Comments */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{track._count?.comments || 0}</span>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-full hover:bg-background transition-colors"
        >
          <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      {/* Play Count Badge */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
        {track.playCount.toLocaleString()} plays
      </div>
    </div>
  )
}