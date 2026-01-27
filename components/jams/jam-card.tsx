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
      className="group relative flex flex-col gap-3 rounded-2xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {jam.currentTrack?.coverUrl ? (
          <img
            src={`/api/stream/image/${jam.currentTrack.coverUrl}`}
            alt={jam.currentTrack.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500/20 to-primary-900/20">
            <Music className="h-12 w-12 text-primary-500/40" />
          </div>
        )}
        
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
