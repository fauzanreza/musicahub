"use client"

import { useState, useRef, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TrackCard } from "@/components/tracks/track-card"
import { Search, Music, Filter, ListMusic, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

interface TracksResponse {
  tracks: Track[]
  nextCursor: string | null
  hasNextPage: boolean
}

const GENRES = [
  "All",
  "Pop",
  "Rock",
  "Hip Hop",
  "Electronic",
  "Jazz",
  "Classical",
  "R&B",
  "Country",
  "Indie",
  "Alternative",
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("All")
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch tracks with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTracks,
  } = useInfiniteQuery<TracksResponse>({
    queryKey: ["tracks", "explore", searchQuery, selectedGenre],
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (selectedGenre !== "All") params.append("genre", selectedGenre)
      if (pageParam) params.append("cursor", pageParam as string)
      
      const res = await fetch(`/api/tracks?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch tracks")
      return res.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  })

  // Flatten all pages into a single array of tracks
  const tracks = data?.pages.flatMap((page) => page.tracks) ?? []

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Fetch public playlists
  const { data: publicPlaylists, isLoading: isLoadingPlaylists } = useInfiniteQuery({
    queryKey: ["playlists", "public", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      
      const res = await fetch(`/api/playlists/public?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch playlists")
      return res.json()
    },
    getNextPageParam: () => null, // No pagination for playlists yet
    initialPageParam: null,
  })

  const playlists = publicPlaylists?.pages[0] ?? []

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
      queryClient.invalidateQueries({ queryKey: ["votes"] })
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
    <div className="min-h-screen bg-background pt-8 pb-32">
      <div className="container px-4 mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
            <p className="text-muted-foreground mt-1">
              Find your next favorite track
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tracks, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedGenre === genre
                    ? "bg-primary-500 text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Playlists Section (Only if searching or no genre filter) */}
        {(selectedGenre === "All") && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-primary-500" />
              <h2 className="text-xl font-bold tracking-tight">Public Playlists</h2>
            </div>
            
            {isLoadingPlaylists ? (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 w-64 flex-shrink-0 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {playlists.map((playlist: any) => (
                  <Link 
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="flex-shrink-0 w-64 flex items-center gap-4 p-4 rounded-xl bg-card border border-white/5 hover:bg-accent transition-all cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <ListMusic className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-sm">{playlist.name}</h3>
                      <p className="text-[10px] text-muted-foreground truncate">
                        By {playlist.user.username} • {playlist._count.tracks} tracks
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchQuery && (
              <p className="text-sm text-muted-foreground">No playlists found for "{searchQuery}"</p>
            )}
          </section>
        )}

        {/* Tracks Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-bold tracking-tight">Tracks</h2>
          </div>

          {isLoadingTracks ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : tracks && tracks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tracks.map((track) => (
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
              
              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more tracks...</span>
                  </div>
                )}
                {!hasNextPage && tracks.length > 0 && (
                  <p className="text-muted-foreground text-sm">
                    You've reached the end! 🎵
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tracks found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
