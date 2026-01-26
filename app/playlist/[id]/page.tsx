
"use client"

import { useQuery } from "@tanstack/react-query"
import { TrackCard } from "@/components/tracks/track-card"
import { ListMusic, Globe, Lock, User, Clock } from "lucide-react"
import { useParams } from "next/navigation"
import Image from "next/image"

export default function PlaylistPage() {
  const { id } = useParams()

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${id}`)
      if (!res.ok) throw new Error("Failed to fetch playlist")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-20">
        <div className="container px-4 mx-auto space-y-8 animate-pulse">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="h-48 w-48 rounded-2xl bg-muted" />
            <div className="space-y-4 flex-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-64 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!playlist) return null

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container px-4 mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left">
          <div className="relative h-48 w-48 rounded-2xl overflow-hidden bg-primary-500/10 flex items-center justify-center shadow-2xl">
            {playlist.coverUrl ? (
              <Image src={playlist.coverUrl} alt={playlist.name} fill className="object-cover" />
            ) : (
              <ListMusic className="h-20 w-20 text-primary-500" />
            )}
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold uppercase tracking-widest text-primary-500">
              {playlist.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {playlist.isPublic ? "Public Playlist" : "Private Playlist"}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">{playlist.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {playlist.user.username[0].toUpperCase()}
                </div>
                <span className="font-bold text-foreground">{playlist.user.username}</span>
              </div>
              <span>•</span>
              <span>{playlist.tracks.length} tracks</span>
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Tracks</h2>
          </div>
          
          {playlist.tracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlist.tracks.map((track: any) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">This playlist is empty</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Music(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
