
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TrackCard } from "@/components/tracks/track-card"
import { Music, Heart, ListMusic, Lock, Globe } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists'>('liked')

  const queryClient = useQueryClient()

  // Fetch liked tracks
  const { data: likedTracks, isLoading: isLoadingLiked } = useQuery({
    queryKey: ["tracks", "liked"],
    queryFn: async () => {
      const res = await fetch("/api/user/liked-tracks")
      if (!res.ok) throw new Error("Failed to fetch liked tracks")
      return res.json()
    },
    enabled: !!session,
  })

  // Fetch playlists
  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ["playlists", "user"],
    queryFn: async () => {
      const res = await fetch("/api/playlists")
      if (!res.ok) throw new Error("Failed to fetch playlists")
      return res.json()
    },
    enabled: !!session,
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({
      trackId,
      type,
    }: {
      trackId: string
      type: "UP" | "DOWN"
    }) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, type }),
      })
      if (!res.ok) throw new Error("Failed to vote")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] })
    },
  })

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const res = await fetch(`/api/tracks/${trackId}/like`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to like")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] })
    },
  })

  const handleVote = (trackId: string, type: "UP" | "DOWN") => {
    voteMutation.mutate({ trackId, type })
  }

  const handleLike = (trackId: string) => {
    likeMutation.mutate(trackId)
  }

  // Redirect if not logged in
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container px-4 mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage your liked songs and personal playlists
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('liked')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'liked' ? "text-primary-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className={`h-4 w-4 ${activeTab === 'liked' ? "fill-current" : ""}`} />
              Liked Songs
            </div>
            {activeTab === 'liked' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'playlists' ? "text-primary-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Playlists
            </div>
            {activeTab === 'playlists' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'liked' ? (
          isLoadingLiked ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : likedTracks && likedTracks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {likedTracks.map((track: any) => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onVote={handleVote}
                  onLike={handleLike}
                  isLiked={track.isLiked}
                  userVote={track.userVote}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No liked songs yet</h3>
              <p className="text-muted-foreground">
                Songs you like will appear here
              </p>
            </div>
          )
        ) : (
          isLoadingPlaylists ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist: any) => (
                <Link 
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-white/5 hover:bg-accent transition-all cursor-pointer"
                >
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-primary-500/10 flex items-center justify-center">
                    {playlist.coverUrl ? (
                      <Image src={playlist.coverUrl} alt={playlist.name} fill className="object-cover" />
                    ) : (
                      <ListMusic className="h-8 w-8 text-primary-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate">{playlist.name}</h3>
                      {playlist.isPublic ? (
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {playlist._count.tracks} tracks • {playlist.isPublic ? 'Public' : 'Private'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <ListMusic className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No playlists yet</h3>
              <p className="text-muted-foreground">
                Create your first playlist from the player
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
