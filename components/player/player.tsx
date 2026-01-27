// components/player/player.tsx

"use client"

import { useEffect, useState } from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { Howl } from "howler"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Music,
  ChevronUp,
  ChevronDown,
  Maximize2,
  ListMusic,
  ListPlus,
  Plus,
  Globe,
  Lock,
  MessageSquare,
  Share2,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

export function Player() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    repeat,
    shuffle,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    isLoading,
    setIsLoading,
    setCurrentTime,
    setDuration,
    setHowl,
    isExpanded,
    setIsExpanded,
    queue,
    setQueue,
    setCurrentTrack: selectTrack,
  } = usePlayerStore()

  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [activeTab, setActiveTab] = useState<'queue' | 'comments'>('queue')
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  // Fetch like status with React Query
  const { data: likeData } = useQuery({
    queryKey: ["votes", "status", currentTrack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/votes/status?trackId=${currentTrack?.id}`)
      if (!res.ok) return { type: null }
      return res.json()
    },
    enabled: !!currentTrack?.id,
  })

  // Fetch comments with React Query
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", currentTrack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/comments?trackId=${currentTrack?.id}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!currentTrack?.id,
  })

  const isLiked = likeData?.type === "UP"
  
  // Playlist states
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<any[]>([])
  const [isFetchingPlaylists, setIsFetchingPlaylists] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [isPublicPlaylist, setIsPublicPlaylist] = useState(true)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)

  // Auto-populate queue with same genre tracks
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentTrack) return

      try {
        // Fetch tracks from same genre
        const res = await fetch(`/api/tracks?genre=${encodeURIComponent(currentTrack.genre)}&limit=10`)
        let recommendations: any[] = []
        
        if (res.ok) {
          const tracks = await res.json()
          recommendations = tracks.filter((t: any) => t.id !== currentTrack.id)
        }

        // If we have few recommendations (genre running out), fetch random tracks from other genres
        if (recommendations.length < 5) {
          const randomRes = await fetch(`/api/tracks?sort=trending&limit=10`)
          if (randomRes.ok) {
            const randomTracks = await randomRes.json()
            const additional = randomTracks.filter((t: any) => 
              t.id !== currentTrack.id && 
              !recommendations.some((rec: any) => rec.id === t.id)
            )
            recommendations = [...recommendations, ...additional]
          }
        }
        
        // If queue is empty or only contains current track, set the new queue
        if (queue.length <= 1) {
          setQueue([currentTrack, ...recommendations])
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
      }
    }

    fetchRecommendations()
  }, [currentTrack?.id])

  // Fetch like status with React Query
  const { data: likeStatus } = useQuery({
    queryKey: ["tracks", "like-status", currentTrack?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tracks/${currentTrack?.id}/like`)
      if (!res.ok) return { liked: false }
      return res.json()
    },
    enabled: !!currentTrack?.id,
  })

  const handleLike = async () => {
    if (!currentTrack) return

    try {
      const res = await fetch(`/api/tracks/${currentTrack.id}/like`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        queryClient.invalidateQueries({ queryKey: ["tracks"] })
        queryClient.invalidateQueries({ queryKey: ["tracks", "like-status", currentTrack.id] })
        toast.success(data.liked ? "Added to liked songs" : "Removed from liked songs")
      } else if (res.status === 401) {
        toast.error("Please login to like songs")
      }
    } catch (error) {
      console.error("Error liking track:", error)
      toast.error("Failed to update like status")
    }
  }

  const handleVote = async (type: "UP" | "DOWN") => {
    if (!currentTrack) return

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: currentTrack.id, type }),
      })

      if (res.ok) {
        const data = await res.json()
        const voted = !!data.vote
        
        // Update local count for immediate feedback
        if (currentTrack.votes) {
          if (type === "UP") {
            currentTrack.votes.ups += voted ? 1 : -1
          } else {
            currentTrack.votes.downs += voted ? 1 : -1
          }
        }
        
        // Invalidate queries for real-time updates on other pages
        queryClient.invalidateQueries({ queryKey: ["tracks"] })
        queryClient.invalidateQueries({ queryKey: ["votes", "status", currentTrack.id] })
        
        if (type === "UP") {
          toast.success(voted ? "Added to liked songs" : "Removed from liked songs")
        } else {
          toast.success(voted ? "Downvoted track" : "Removed downvote")
        }
      } else if (res.status === 401) {
        toast.error("Please login to vote")
      }
    } catch (error) {
      console.error("Error voting track:", error)
      toast.error("Failed to update vote status")
    }
  }

  const handleShare = () => {
    if (!currentTrack) return
    const url = `${window.location.origin}/track/${currentTrack.id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTrack || !newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: currentTrack.id, content: newComment }),
      })

      if (res.ok) {
        setNewComment("")
        queryClient.invalidateQueries({ queryKey: ["comments", currentTrack.id] })
        toast.success("Comment posted!")
      } else if (res.status === 401) {
        toast.error("Please login to post a comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast.error("Failed to post comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const fetchPlaylists = async () => {
    setIsFetchingPlaylists(true)
    try {
      const res = await fetch("/api/playlists")
      if (res.ok) {
        const data = await res.json()
        setUserPlaylists(data)
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
    } finally {
      setIsFetchingPlaylists(false)
    }
  }

  const addToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: currentTrack.id }),
      })

      if (res.ok) {
        toast.success("Added to playlist")
        setShowPlaylistModal(false)
        queryClient.invalidateQueries({ queryKey: ["playlists"] })
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add to playlist")
      }
    } catch (error) {
      console.error("Error adding to playlist:", error)
      toast.error("An error occurred")
    }
  }

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim() || isCreatingPlaylist) return

    setIsCreatingPlaylist(true)
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newPlaylistName,
          isPublic: isPublicPlaylist
        }),
      })

      if (res.ok) {
        const playlist = await res.json()
        setNewPlaylistName("")
        setIsPublicPlaylist(true)
        toast.success("Playlist created")
        // Add current track to the new playlist
        await addToPlaylist(playlist.id)
        fetchPlaylists()
      } else {
        toast.error("Failed to create playlist")
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error("An error occurred")
    } finally {
      setIsCreatingPlaylist(false)
    }
  }

  const handlePlaylistButtonClick = () => {
    setShowPlaylistModal(true)
    fetchPlaylists()
  }

  // Initialize Howler when track changes
  useEffect(() => {
    if (!currentTrack) return

    // Increment play count
    const recordPlay = async () => {
      try {
        await fetch(`/api/tracks/${currentTrack.id}/play`, { method: "POST" })
      } catch (error) {
        console.error("Failed to record play:", error)
      }
    }
    recordPlay()

    // Convert filename to streaming URL
    const streamUrl = `/api/stream/audio/${currentTrack.audioUrl}`

    const sound = new Howl({
      src: [streamUrl],
      html5: true,
      format: ['mp3', 'wav', 'ogg'],
      volume: volume,
      onload: () => {
        setDuration(sound.duration())
        setIsLoading(false)
      },
      onloaderror: (id, err) => {
        console.error("Load error:", err)
        setIsLoading(false)
      },
      onplay: () => {
        requestAnimationFrame(updateProgress)
      },
      onplayerror: (id, err) => {
        console.error("Play error:", err)
        setIsLoading(false)
      },
      onend: () => {
        if (repeat === "one") {
          sound.seek(0)
          sound.play()
        } else {
          next()
        }
      },
    })

    setHowl(sound)
    const { isPlaying: currentIsPlaying } = usePlayerStore.getState()
    if (currentIsPlaying && !sound.playing()) {
      sound.play()
    }

    // Handle potential autoplay block
    const resumeAudio = () => {
      const { isPlaying: currentIsPlaying } = usePlayerStore.getState()
      if (sound.state() === 'loaded' && currentIsPlaying && !sound.playing()) {
        sound.play()
      }
      if (sound.playing() || !currentIsPlaying) {
        window.removeEventListener('click', resumeAudio)
      }
    }
    window.addEventListener('click', resumeAudio)

    return () => {
      sound.unload()
      window.removeEventListener('click', resumeAudio)
    }
  }, [currentTrack?.id])

  // Update progress
  const updateProgress = () => {
    const { howl, isPlaying } = usePlayerStore.getState()
    if (howl && isPlaying) {
      setCurrentTime(howl.seek() as number)
      requestAnimationFrame(updateProgress)
    }
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    seek(time)
  }

  // Handle volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.7)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!mounted || !currentTrack) return null
  
  return (
    <>
      {/* Expanded Player Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-background transition-all duration-500 ease-in-out overflow-y-auto md:overflow-hidden flex flex-col ${
          isExpanded ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Dynamic Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/20 via-background to-background opacity-60 pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative flex-1 container mx-auto max-w-7xl flex flex-col p-4 md:p-6 min-h-0">
          {/* Header - Reduced Margin */}
          <div className="flex items-center justify-between mb-2 md:mb-4 flex-shrink-0">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-accent rounded-full transition-colors bg-white/5 md:bg-transparent"
            >
              <ChevronDown className="h-6 w-6 md:h-8 md:w-8" />
            </button>
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Now Playing</p>
              <p className="text-xs md:text-sm font-semibold truncate max-w-[150px] md:max-w-none">{currentTrack.genre}</p>
            </div>
            <div className="w-10 md:w-12" />
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto md:overflow-hidden custom-scrollbar">
            <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16 p-2 md:p-0">
              {/* Left Side: Cover Art + Info + Controls (Mobile Stack) */}
              <div className="w-full md:flex-1 flex flex-col items-center max-w-[500px] md:max-w-none">
                {/* Sharp Square Cover Art */}
                <div className="w-full aspect-square relative group shadow-2xl flex-shrink-0 md:max-w-[600px] md:w-[50vw]">
                  <Image
                    src={currentTrack?.coverUrl ? `/api/stream/image/${currentTrack.coverUrl}` : "/default-cover.jpg"}
                    alt={currentTrack?.title || "Cover"}
                    fill
                    className="object-cover animate-in zoom-in duration-700 rounded-none"
                  />
                </div>

                {/* Track Info & Interations - Mobile Visible, Desktop Hidden (since it's in the bottom row) */}
                <div className="w-full mt-6 md:hidden space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl font-bold tracking-tight truncate">{currentTrack?.title}</h1>
                      <Link href={`/user/${currentTrack?.creator?.id}`} className="text-sm text-muted-foreground truncate hover:text-primary-500 hover:underline transition-colors block" onClick={() => setIsExpanded(false)}>
                        {currentTrack?.creator?.username}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={handleLike} className={`p-2 ${likeStatus?.liked ? "text-red-500" : "text-muted-foreground"}`}>
                        <Heart className={`h-6 w-6 ${likeStatus?.liked ? "fill-current" : ""}`} />
                      </button>
                      <button onClick={() => handleVote("UP")} className={`p-2 flex items-center gap-1.5 ${likeData?.type === "UP" ? "text-primary-500" : "text-muted-foreground"}`}>
                        <TrendingUp className={`h-6 w-6 ${likeData?.type === "UP" ? "fill-current" : ""}`} />
                        <span className="text-sm font-bold">{currentTrack?.votes?.ups || 0}</span>
                      </button>
                      <button onClick={() => handleVote("DOWN")} className={`p-2 flex items-center gap-1.5 ${likeData?.type === "DOWN" ? "text-red-500" : "text-muted-foreground"}`}>
                        <TrendingDown className={`h-6 w-6 ${likeData?.type === "DOWN" ? "fill-current" : ""}`} />
                        <span className="text-sm font-bold">{currentTrack?.votes?.downs || 0}</span>
                      </button>
                      <button onClick={handlePlaylistButtonClick} className="p-2 text-muted-foreground">
                        <ListPlus className="h-6 w-6" />
                      </button>
                      <button onClick={handleShare} className="p-2 text-muted-foreground">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar - Mobile */}
                  <div className="space-y-2">
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground/60">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls - Mobile */}
                  <div className="flex items-center justify-center gap-8 pb-4">
                    <button onClick={previous} className="text-foreground"><SkipBack className="h-8 w-8 fill-current" /></button>
                    <button 
                      onClick={togglePlay}
                      className="p-5 bg-primary-500 text-white rounded-full shadow-xl"
                    >
                      {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-8 w-8 fill-current" />
                      ) : (
                        <Play className="h-8 w-8 fill-current ml-1" />
                      )}
                    </button>
                    <button onClick={next} className="text-foreground"><SkipForward className="h-8 w-8 fill-current" /></button>
                  </div>

                  {/* Mobile Volume Control */}
                  <div className="flex items-center justify-center gap-4 w-full px-8 pb-6">
                    <button onClick={toggleMute} className="text-muted-foreground">
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Sidebar (Desktop Side-by-Side, Mobile Bottom) */}
              <div className="w-full md:w-[450px] flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden rounded-none md:h-[min(50vw,600px)] flex-shrink-0">
                <div className="flex border-b border-white/10">
                  <button 
                    onClick={() => setActiveTab('queue')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'queue' ? "text-primary-500 border-b-2 border-primary-500 bg-white/5" : "text-muted-foreground"
                    }`}
                  >
                    Up Next
                  </button>
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'comments' ? "text-primary-500 border-b-2 border-primary-500 bg-white/5" : "text-muted-foreground"
                    }`}
                  >
                    Comments
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[300px] md:min-h-0">
                  {activeTab === 'queue' ? (
                    <div className="space-y-3">
                      {queue.filter(t => t.id !== currentTrack?.id).map((track) => (
                        <div key={track.id} onClick={() => selectTrack(track)} className="flex items-center gap-4 p-2.5 hover:bg-white/5 cursor-pointer group">
                          <div className="relative h-12 w-12 flex-shrink-0">
                            <Image src={track.coverUrl ? `/api/stream/image/${track.coverUrl}` : "/default-cover.jpg"} alt={track.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Play className="h-4 w-4 text-white fill-current" /></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-xs">{track.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{track.creator.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <form onSubmit={handleCommentSubmit} className="mb-4">
                        <div className="relative">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-white/5 border border-white/10 p-3 text-xs outline-none focus:ring-1 focus:ring-primary-500 resize-none min-h-[80px]"
                          />
                          <button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="absolute bottom-3 right-3 bg-primary-500 text-white px-4 py-1.5 text-[10px] font-bold">Post</button>
                        </div>
                      </form>
                      <div className="space-y-4">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-400">{comment.user.username[0].toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs">{comment.user.username}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-muted-foreground/90 leading-relaxed break-words">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Only: Bottom Row Controls */}
            <div className="hidden md:flex flex-col w-full max-w-[calc(min(50vw,600px)+450px+4rem)] mx-auto mt-12 space-y-6 flex-shrink-0">
              <div className="flex items-center justify-between gap-10">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight truncate">{currentTrack?.title}</h1>
                  <Link href={`/user/${currentTrack?.creator?.id}`} className="text-base text-muted-foreground truncate hover:text-primary-500 hover:underline transition-colors block" onClick={() => setIsExpanded(false)}>
                    {currentTrack?.creator?.username}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleLike} className={`transition-colors ${likeStatus?.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                    <Heart className={`h-6 w-6 ${likeStatus?.liked ? "fill-current" : ""}`} />
                  </button>
                  <button onClick={() => handleVote("UP")} className={`flex items-center gap-2 transition-colors ${likeData?.type === "UP" ? "text-primary-500" : "text-muted-foreground hover:text-primary-500"}`}>
                    <TrendingUp className={`h-6 w-6 ${likeData?.type === "UP" ? "fill-current" : ""}`} />
                    <span className="text-sm font-bold">{currentTrack?.votes?.ups || 0}</span>
                  </button>
                  <button onClick={() => handleVote("DOWN")} className={`flex items-center gap-2 transition-colors ${likeData?.type === "DOWN" ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                    <TrendingDown className={`h-6 w-6 ${likeData?.type === "DOWN" ? "fill-current" : ""}`} />
                    <span className="text-sm font-bold">{currentTrack?.votes?.downs || 0}</span>
                  </button>
                  <button onClick={() => setActiveTab('comments')} className={`transition-colors ${activeTab === 'comments' ? "text-primary-500" : "text-muted-foreground hover:text-primary-500"}`}>
                    <MessageSquare className="h-6 w-6" />
                  </button>
                  <button onClick={handleShare} className="text-muted-foreground hover:text-primary-500 transition-colors">
                    <Share2 className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                  <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pb-8">
                <div className="w-48" /> {/* Spacer to balance volume */}
                
                <div className="flex items-center gap-16">
                  <button onClick={toggleShuffle} className={shuffle ? "text-primary-500" : "text-muted-foreground/60"}><Shuffle className="h-5 w-5" /></button>
                  <button onClick={previous} className="text-foreground"><SkipBack className="h-8 w-8 fill-current" /></button>
                  <button onClick={togglePlay} className="p-5 bg-primary-500 text-white rounded-full shadow-xl hover:scale-105 transition-transform">
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-8 w-8 fill-current" />
                    ) : (
                      <Play className="h-8 w-8 fill-current ml-1" />
                    )}
                  </button>
                  <button onClick={next} className="text-foreground"><SkipForward className="h-8 w-8 fill-current" /></button>
                  <button onClick={toggleRepeat} className={repeat !== "off" ? "text-primary-500" : "text-muted-foreground/60"}>
                    {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                  </button>
                  <button onClick={handlePlaylistButtonClick} className="text-muted-foreground hover:text-primary-500 transition-colors">
                    <ListPlus className="h-5 w-5" />
                  </button>
                </div>

                {/* Desktop Volume Control */}
                <div className="flex items-center gap-3 w-48 justify-end">
                  <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
                    {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="container mx-auto max-w-5xl pointer-events-auto">
        <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 md:p-3 flex flex-col md:flex-row items-center gap-4 animate-slide-up">
          
          {/* Mobile Progress Bar (Top) */}
          <div className="w-full md:hidden flex items-center gap-2">
             <span className="text-[10px] text-muted-foreground w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
            />
             <span className="text-[10px] text-muted-foreground w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Track Info */}
          <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 min-w-0">
            <div 
              className="relative h-14 w-14 flex-shrink-0 group cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <Image
                src={currentTrack?.coverUrl ? `/api/stream/image/${currentTrack.coverUrl}` : "/default-cover.jpg"}
                alt={currentTrack?.title || "Track"}
                fill
                className="rounded-xl shadow-md object-cover"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate text-sm md:text-base">{currentTrack?.title}</p>
              <Link 
                href={`/user/${currentTrack?.creator?.id}`} 
                className="text-xs md:text-sm text-muted-foreground truncate hover:text-primary-500 hover:underline transition-colors block w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                {currentTrack?.creator?.username}
              </Link>
            </div>
            
                <div className="md:hidden flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                    className="text-foreground hover:text-primary-500 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-6 w-6 fill-current" />
                    ) : (
                      <Play className="h-6 w-6 fill-current" />
                    )}
                  </button>
                  <button 
                    onClick={handleLike}
                    className={`transition-colors ${likeStatus?.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                  >
                    <Heart className={`h-5 w-5 ${likeStatus?.liked ? "fill-current" : ""}`} />
                  </button>
                  <button 
                    onClick={() => handleVote("UP")}
                    className={`transition-colors ${likeData?.type === "UP" ? "text-primary-500" : "text-muted-foreground hover:text-primary-500"}`}
                  >
                    <TrendingUp className={`h-5 w-5 ${likeData?.type === "UP" ? "fill-current" : ""}`} />
                  </button>
                  <button 
                    onClick={() => handleVote("DOWN")}
                    className={`transition-colors ${likeData?.type === "DOWN" ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                  >
                    <TrendingDown className={`h-5 w-5 ${likeData?.type === "DOWN" ? "fill-current" : ""}`} />
                  </button>
                </div>
          </div>

          {/* Desktop Controls & Progress */}
          <div className="flex flex-col items-center gap-2 w-full md:flex-[2]">
            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-colors ${
                  shuffle
                    ? "text-primary-500 bg-primary-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              
              <button
                onClick={previous}
                className="p-2 text-foreground hover:text-primary-500 transition-colors"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              
              <button
                onClick={togglePlay}
                className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-1" />
                )}
              </button>
              
              <button
                onClick={next}
                className="p-2 text-foreground hover:text-primary-500 transition-colors"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
              
              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-full transition-colors ${
                  repeat !== "off"
                    ? "text-primary-500 bg-primary-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {repeat === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>

              <button onClick={handlePlaylistButtonClick} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-primary-500">
                <ListPlus className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 group">
                <button onClick={toggleMute} className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Desktop Progress Bar */}
            <div className="hidden md:flex items-center gap-3 w-full max-w-md">
              <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 h-1 group cursor-pointer">
                <div className="absolute inset-0 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 font-mono">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Extra Actions */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
             <button 
              onClick={handleLike}
              className={`transition-colors ${likeStatus?.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
            >
              <Heart className={`h-4 w-4 ${likeStatus?.liked ? "fill-current" : ""}`} />
            </button>
             <button 
              onClick={() => handleVote("UP")}
              className={`flex items-center gap-1.5 transition-colors ${likeData?.type === "UP" ? "text-primary-500" : "text-muted-foreground hover:text-primary-500"}`}
            >
              <TrendingUp className={`h-4 w-4 ${likeData?.type === "UP" ? "fill-current" : ""}`} />
              <span className="text-[10px] font-bold">{currentTrack?.votes?.ups || 0}</span>
            </button>
            <button 
              onClick={() => handleVote("DOWN")}
              className={`flex items-center gap-1.5 transition-colors ${likeData?.type === "DOWN" ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
            >
              <TrendingDown className={`h-4 w-4 ${likeData?.type === "DOWN" ? "fill-current" : ""}`} />
              <span className="text-[10px] font-bold">{currentTrack?.votes?.downs || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Playlist Modal */}
    {showPlaylistModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-background border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">Add to Playlist</h2>
            <button onClick={() => setShowPlaylistModal(false)} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-6 w-6 rotate-180" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Create New Playlist */}
            <div className="space-y-3">
              <form onSubmit={createPlaylist} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button 
                  type="submit" 
                  disabled={!newPlaylistName.trim() || isCreatingPlaylist}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isCreatingPlaylist ? "..." : <Plus className="h-5 w-5" />}
                </button>
              </form>
              
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isPublicPlaylist ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {isPublicPlaylist ? "Public - visible to everyone" : "Private - only you can see"}
                </span>
                <button 
                  onClick={() => setIsPublicPlaylist(!isPublicPlaylist)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isPublicPlaylist ? 'bg-primary-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isPublicPlaylist ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Existing Playlists */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {isFetchingPlaylists ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading playlists...</div>
              ) : userPlaylists.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No playlists yet</div>
              ) : (
                userPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylist(playlist.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                        <ListMusic className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{playlist.name}</p>
                          {!playlist.isPublic && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{playlist._count.tracks} tracks</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary-500 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}