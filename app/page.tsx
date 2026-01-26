// app/page.tsx

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TrackCard } from "@/components/tracks/track-card"
import { Sparkles, TrendingUp, Clock } from "lucide-react"

interface Track {
  id: string
  title: string
  audioUrl: string
  coverUrl: string | null
  genre: string
  playCount: number
  creator: {
    id: string
    username: string
    avatar: string | null
  }
  votes: {
    ups: number
    downs: number
  }
  _count: {
    comments: number
  }
}

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const router = useRouter()

  // Fetch trending tracks
  const { data: trendingTracks } = useQuery<Track[]>({
    queryKey: ["tracks", "trending"],
    queryFn: async () => {
      const res = await fetch("/api/tracks?sort=trending&limit=8")
      if (!res.ok) throw new Error("Failed to fetch tracks")
      return res.json()
    },
  })

  // Fetch recent tracks
  const { data: recentTracks } = useQuery<Track[]>({
    queryKey: ["tracks", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/tracks?sort=recent&limit=8")
      if (!res.ok) throw new Error("Failed to fetch tracks")
      return res.json()
    },
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

  const handleVote = (trackId: string, type: "UP" | "DOWN") => {
    if (!session) {
      router.push("/login")
      return
    }
    voteMutation.mutate({ trackId, type })
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="container px-4 mx-auto space-y-12">
        {/* Header / Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {session ? `Welcome back, ${session.user?.name?.split(' ')[0]}` : 'Discover Music'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Listen to the latest hits and community favorites.
            </p>
          </div>
          {!session && (
             <button 
               onClick={() => router.push("/login")}
               className="hidden md:inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary-700"
             >
               Sign In to Upload
             </button>
          )}
        </div>

        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold tracking-tight">Trending Now</h2>
            </div>
            <button className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trendingTracks?.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onVote={handleVote}
              />
            ))}
            {!trendingTracks && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </section>

        {/* New Releases Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <h2 className="text-xl font-bold tracking-tight">Fresh Drops</h2>
            </div>
            <button className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recentTracks?.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onVote={handleVote}
              />
            ))}
             {!recentTracks && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}