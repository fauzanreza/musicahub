"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TrackCard } from "@/components/tracks/track-card"
import { Sparkles, TrendingUp, Clock, Radio, ArrowRight, Music } from "lucide-react"
import { JamCard } from "@/components/jams/jam-card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  isLiked: boolean
  userVote: "UP" | "DOWN" | null
}

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

  // Fetch live jams
  const { data: liveJams } = useQuery<any[]>({
    queryKey: ["jams", "live"],
    queryFn: async () => {
      const res = await fetch("/api/jams")
      if (!res.ok) throw new Error("Failed to fetch jams")
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
    if (!session) {
      router.push("/login")
      return
    }
    voteMutation.mutate({ trackId, type })
  }

  const handleLike = (trackId: string) => {
    if (!session) {
      router.push("/login")
      return
    }
    likeMutation.mutate(trackId)
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

        {/* Listening Party Banner / Live Jams */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 p-8 md:p-12 shadow-2xl shadow-primary-500/20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-96 w-96 bg-white/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-64 w-64 bg-purple-400/20 blur-[80px] rounded-full" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold backdrop-blur-md">
                <Radio className="h-3 w-3 animate-pulse" />
                LISTENING PARTY
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display">
                  Vibe Together, <span className="text-primary-200">Live.</span>
                </h2>
                <p className="text-primary-100/80 max-w-md text-lg font-medium leading-relaxed">
                  Join real-time music sessions with people around the world. Chat, react, and discover music together.
                </p>
              </div>
              <Link
                href="/jams"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-primary-600 font-black hover:bg-primary-50 transition-all shadow-xl shadow-black/10 active:scale-95 group"
              >
                Explore Parties
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {liveJams && liveJams.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar max-w-full md:max-w-[50%]">
                {liveJams.slice(0, 3).map((jam) => (
                  <div key={jam.id} className="min-w-[220px] shrink-0">
                    <JamCard jam={jam} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-6 opacity-40">
                <div className="h-40 w-40 rounded-[2rem] bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Music className="h-16 w-16 text-white" />
                </div>
                <div className="h-40 w-40 rounded-[2rem] bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Radio className="h-16 w-16 text-white" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold tracking-tight">Trending Now</h2>
            </div>
            <Link 
              href="/explore"
              className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trendingTracks?.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onVote={handleVote}
                onLike={handleLike}
                isLiked={track.isLiked}
                userVote={track.userVote}
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
            <Link 
              href="/explore"
              className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recentTracks?.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onVote={handleVote}
                onLike={handleLike}
                isLiked={track.isLiked}
                userVote={track.userVote}
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