"use client"

import Link from "next/link"
import { Users, Music, Play } from "lucide-react"

interface JamCardProps {
  jam: {
    id: string
    name: string
    host: {
      username: string
      avatar: string | null
    }
    currentTrack: {
      title: string
      coverUrl: string | null
    } | null
    _count: {
      members: number
    }
  }
}

export function JamCard({ jam }: JamCardProps) {
  return (
    <Link
      href={`/jams/${jam.id}`}
      className="group relative flex flex-col gap-3 rounded-2xl bg-card/50 backdrop-blur-md p-4 border border-border hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <img
          src={jam.currentTrack?.coverUrl ? `/api/stream/image/${jam.currentTrack.coverUrl}` : "/default-cover.jpg"}
          alt={jam.currentTrack?.title || "Jam"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold truncate text-sm">{jam.name}</h3>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate">Host: {jam.host.username}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Users className="h-3 w-3" />
            {jam._count.members}
          </div>
        </div>
      </div>
    </Link>
  )
}
