// components/player/player.tsx

"use client"

import { useEffect, useState } from "react"
import { usePlayerStore } from "@/lib/store/player-store"
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
  MessageSquare,
  ThumbsUp,
  Share2,
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
    setCurrentTime,
    setDuration,
    setHowl,
    isExpanded,
    setIsExpanded,
    queue,
    setQueue,
    setCurrentTrack: selectTrack,
  } = usePlayerStore()

  const [isMuted, setIsMuted] = useState(false)
  const [activeTab, setActiveTab] = useState<'queue' | 'comments'>('queue')
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Auto-populate queue with same genre tracks
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentTrack) return

      try {
        const res = await fetch(`/api/tracks?genre=${encodeURIComponent(currentTrack.genre)}&limit=10`)
        if (res.ok) {
          const tracks = await res.json()
          // Filter out the current track and update queue
          const recommendations = tracks.filter((t: any) => t.id !== currentTrack.id)
          
          // If queue is empty or only contains current track, set the new queue
          if (queue.length <= 1) {
            setQueue([currentTrack, ...recommendations])
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
      }
    }

    fetchRecommendations()
  }, [currentTrack?.id])

  // Fetch comments and like status
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!currentTrack) return

      try {
        // Fetch comments
        const commentsRes = await fetch(`/api/comments?trackId=${currentTrack.id}`)
        if (commentsRes.ok) {
          const data = await commentsRes.json()
          setComments(data)
        }

        // Fetch session to check if liked (simplified for now, ideally API returns this)
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        
        if (session?.user?.id) {
          // Check if user has liked (UP vote)
          const voteRes = await fetch(`/api/votes/status?trackId=${currentTrack.id}`)
          if (voteRes.ok) {
            const voteData = await voteRes.json()
            setIsLiked(voteData.type === "UP")
          }
        }
      } catch (error) {
        console.error("Error fetching track data:", error)
      }
    }

    fetchTrackData()
  }, [currentTrack?.id])

  const handleLike = async () => {
    if (!currentTrack) return

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: currentTrack.id, type: "UP" }),
      })

      if (res.ok) {
        const data = await res.json()
        const liked = !!data.vote
        setIsLiked(liked)
        toast.success(liked ? "Added to liked songs" : "Removed from liked songs")
      } else if (res.status === 401) {
        toast.error("Please login to like songs")
      }
    } catch (error) {
      console.error("Error liking track:", error)
      toast.error("Failed to update like status")
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
        const comment = await res.json()
        setComments([comment, ...comments])
        setNewComment("")
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

  // Initialize Howler when track changes
  useEffect(() => {
    if (!currentTrack) return

    // Convert filename to streaming URL
    const streamUrl = `/api/stream/audio/${currentTrack.audioUrl}`

    const sound = new Howl({
      src: [streamUrl],
      html5: true,
      format: ['mp3', 'wav', 'ogg'],
      volume: volume,
      onload: () => {
        setDuration(sound.duration())
      },
      onplay: () => {
        requestAnimationFrame(updateProgress)
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
    if (isPlaying) {
      sound.play()
    }

    return () => {
      sound.unload()
    }
  }, [currentTrack])

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

  if (!currentTrack) return null
  
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
                      <button onClick={handleLike} className={`p-2 ${isLiked ? "text-primary-500" : "text-muted-foreground"}`}>
                        <ThumbsUp className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
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
                      {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                    </button>
                    <button onClick={next} className="text-foreground"><SkipForward className="h-8 w-8 fill-current" /></button>
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
                        {comments.map((comment) => (
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
                  <button onClick={handleLike} className={`p-2.5 ${isLiked ? "text-primary-500" : "text-muted-foreground"}`}>
                    <ThumbsUp className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
                  </button>
                  <button onClick={() => setActiveTab('comments')} className={`p-2.5 ${activeTab === 'comments' ? "text-primary-500" : "text-muted-foreground"}`}>
                    <MessageSquare className="h-6 w-6" />
                  </button>
                  <button onClick={handleShare} className="p-2.5 text-muted-foreground">
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

              <div className="flex items-center justify-center gap-16 pb-8">
                <button onClick={toggleShuffle} className={shuffle ? "text-primary-500" : "text-muted-foreground/60"}><Shuffle className="h-5 w-5" /></button>
                <button onClick={previous} className="text-foreground"><SkipBack className="h-8 w-8 fill-current" /></button>
                <button onClick={togglePlay} className="p-5 bg-primary-500 text-white rounded-full shadow-xl hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                </button>
                <button onClick={next} className="text-foreground"><SkipForward className="h-8 w-8 fill-current" /></button>
                <button onClick={toggleRepeat} className={repeat !== "off" ? "text-primary-500" : "text-muted-foreground/60"}>
                  {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                </button>
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
              className="relative group cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <Image
                src={currentTrack?.coverUrl ? `/api/stream/image/${currentTrack.coverUrl}` : "/default-cover.jpg"}
                alt={currentTrack?.title || "Track"}
                width={56}
                height={56}
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
            
            <button className="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
              <Heart className="h-5 w-5" />
            </button>
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
                {isPlaying ? (
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
             <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-primary-500">
              <Heart className="h-4 w-4" />
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
        </div>
      </div>
    </div>
    </>
  )
}