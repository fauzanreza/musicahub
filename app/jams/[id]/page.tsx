"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  Users, 
  Music, 
  Send, 
  Heart, 
  Flame, 
  Smile, 
  MoreVertical, 
  Crown, 
  Plus,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  ArrowUp,
  ArrowDown,
  Trash2,
  LogOut,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import { useSocket } from "@/hooks/use-socket"
import { usePlayerStore } from "@/lib/store/player-store"
import { AddTrackModal } from "@/components/jams/add-track-modal"
import { EditJamModal } from "@/components/jams/edit-jam-modal"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import Image from "next/image"

export default function JamPage() {
  const params = useParams()
  const id = params?.id as string
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket()
  
  const { 
    currentTrack: playerTrack, 
    isPlaying: isPlayerPlaying, 
    currentTime, 
    setCurrentTrack, 
    play, 
    pause, 
    seek,
    setQueue: setPlayerQueue,
    setActiveJam,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
    next,
    previous,
    activeJamId,
    jamMessages,
    reactions,
    addJamMessage,
    addReaction,
    leaveJam,
  } = usePlayerStore()

  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"chat" | "listeners">("chat")
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMobileEmojiPicker, setShowMobileEmojiPicker] = useState(false)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const mobileEmojiPickerRef = useRef<HTMLDivElement>(null)

  // Fetch Jam data
  const { data: jam, isLoading, error } = useQuery({
    queryKey: ["jam", id],
    queryFn: async () => {
      const res = await fetch(`/api/jams/${id}`)
      if (!res.ok) {
        if (res.status === 403) throw new Error("Private Jam")
        throw new Error("Jam not found")
      }
      return res.json()
    },
    refetchInterval: 5000, // Polling as fallback
  })

  const isHost = jam?.hostId === session?.user?.id

  // Socket setup
  useEffect(() => {
    if (!socket || !jam) return

    socket.emit("join-jam", jam.id)
    
    // Only show welcome toast if we are joining a NEW jam
    if (activeJamId !== jam.id) {
      toast.success(`Welcome to ${jam.name}!`, {
        description: "You're now listening live with the group.",
        icon: <Users className="h-4 w-4" />
      })
    }

    const handleUserJoined = () => {
      queryClient.invalidateQueries({ queryKey: ["jam", id] })
      toast.info("A new listener joined!", {
        icon: <Users className="h-4 w-4" />
      })
    }

    socket.on("user-joined", handleUserJoined)

    return () => {
      socket.off("user-joined", handleUserJoined)
    }
  }, [socket, jam?.id, session?.user?.id, activeJamId, queryClient, id])



  // Set active jam in store and force sync initial state
  useEffect(() => {
    if (jam && session?.user) {
      setActiveJam(jam.id, isHost)
      
      // Force update track if we're just joining or if it's different
      if (jam.currentTrack && playerTrack?.id !== jam.currentTrack.id) {
        setCurrentTrack(jam.currentTrack)
        if (jam.isPlaying) {
          play()
        } else {
          pause()
        }
      }
      
      // Sync queue
      if (jam.queue) {
        setPlayerQueue(jam.queue.map((item: any) => item.track))
      }
    }
  }, [jam, session, isHost, setActiveJam])

  // Sync local player track with jam current track
  useEffect(() => {
    if (jam?.currentTrack && playerTrack?.id !== jam.currentTrack.id) {
      setCurrentTrack(jam.currentTrack)
    }
  }, [jam?.currentTrack, playerTrack?.id, setCurrentTrack])

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [jamMessages])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (mobileEmojiPickerRef.current && !mobileEmojiPickerRef.current.contains(event.target as Node)) {
        setShowMobileEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !socket || !session) return

    const msg = {
      userId: session.user?.id,
      username: session.user?.name,
      content: message,
      createdAt: new Date().toISOString(),
    }

    // Add message locally immediately for instant feedback
    addJamMessage(msg)
    socket.emit("send-message", { jamId: jam.id, message: msg })
    setMessage("")
    setShowEmojiPicker(false)
    setShowMobileEmojiPicker(false)
  }

  const addEmoji = (emoji: any) => {
    setMessage((prev) => prev + emoji.native)
    setShowEmojiPicker(false)
    setShowMobileEmojiPicker(false)
  }

  const handleSendReaction = (type: string) => {
    const userId = session?.user?.id
    if (!socket || !userId) return
    addReaction({ reaction: type, userId })
    socket.emit("send-reaction", { jamId: jam.id, reaction: type, userId })
  }

  const handleShareInvitation = () => {
    if (!jam) return
    
    let text = ""
    const link = `${window.location.origin}/jams/${jam.id}`
    
    if (jam.isPublic) {
      text = `Join my listening party on MusicaHub! 🎵\n${link}`
    } else {
      text = `Join my private listening party on MusicaHub! 🔒\n${link}\nCode: ${jam.roomCode}`
    }
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Invitation copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const promoteToHost = async (userId: string) => {
    try {
      const res = await fetch(`/api/jams/${id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error("Failed to promote")
      toast.success("New host appointed!")
      queryClient.invalidateQueries({ queryKey: ["jam", id] })
    } catch (error) {
      toast.error("Failed to promote user")
    }
  }

  const handleNext = async () => {
    if (!isHost || !jam || jam.queue.length === 0) return
    
    // Find next track in queue
    const currentIndex = jam.queue.findIndex((item: any) => item.trackId === jam.currentTrackId)
    const nextTrack = jam.queue[currentIndex + 1]?.track || jam.queue[0]?.track
    
    if (nextTrack) {
      try {
        await fetch(`/api/jams/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentTrackId: nextTrack.id, isPlaying: true, seekPosition: 0 }),
        })
        setCurrentTrack(nextTrack)
        play()
        queryClient.invalidateQueries({ queryKey: ["jam", id] })
      } catch (error) {
        toast.error("Failed to skip track")
      }
    }
  }

  const handlePrevious = async () => {
    if (!isHost || !jam || jam.queue.length === 0) return
    
    // Find previous track in queue
    const currentIndex = jam.queue.findIndex((item: any) => item.trackId === jam.currentTrackId)
    const prevTrack = currentIndex > 0 ? jam.queue[currentIndex - 1]?.track : jam.queue[jam.queue.length - 1]?.track
    
    if (prevTrack) {
      try {
        await fetch(`/api/jams/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentTrackId: prevTrack.id, isPlaying: true, seekPosition: 0 }),
        })
        setCurrentTrack(prevTrack)
        play()
        queryClient.invalidateQueries({ queryKey: ["jam", id] })
      } catch (error) {
        toast.error("Failed to skip track")
      }
    }
  }
  const handleDeleteJam = async () => {
    if (!isHost) return
    
    if (!confirm("Are you sure you want to delete this listening party? This will end the session for everyone.")) {
      return
    }

    try {
      const res = await fetch(`/api/jams/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Listening party deleted")
        setActiveJam(null, false)
        router.push("/")
      } else {
        toast.error("Failed to delete listening party")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleTogglePlay = async () => {
    if (!isHost || !jam) return
    const newState = !isPlayerPlaying
    try {
      await fetch(`/api/jams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPlaying: newState }),
      })
      if (newState) play()
      else pause()
      queryClient.invalidateQueries({ queryKey: ["jam", id] })
    } catch (error) {
      toast.error("Failed to toggle playback")
    }
  }


  const handleDeleteTrack = async (jamTrackId: string) => {
    if (!isHost) return
    try {
      const res = await fetch(`/api/jams/${id}/queue/${jamTrackId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete track")
      toast.success("Track removed from queue")
      queryClient.invalidateQueries({ queryKey: ["jam", id] })
    } catch (error) {
      toast.error("Failed to remove track")
    }
  }

  const handleReorderTrack = async (jamTrackId: string, direction: "up" | "down") => {
    if (!isHost) return
    try {
      const res = await fetch(`/api/jams/${id}/queue/${jamTrackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to reorder track")
      }
      queryClient.invalidateQueries({ queryKey: ["jam", id] })
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder track")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Oops! {error.message}</h1>
        <button 
          onClick={() => router.push("/")}
          className="rounded-full bg-primary-600 px-6 py-2 text-white"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
              <Music className="h-6 w-6 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-black text-foreground tracking-tight truncate">{jam.name}</h1>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-primary-500">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px] md:max-w-none">{jam.host.username}</span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {jam.members.length} listening
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareInvitation}
              className="hidden sm:flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-2.5 text-sm font-bold hover:bg-muted transition-all border border-border group shrink-0"
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {jam.isPublic ? "SHARE INVITE" : "INVITE CODE"}
              </span>
              {jam.roomCode && (
                <span className="font-mono text-primary-500 tracking-wider">{jam.roomCode}</span>
              )}
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />}
            </button>
            
            <button
              onClick={() => {
                leaveJam()
                router.push("/")
                toast.success("Left the listening party")
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Leave Party</span>
            </button>

            {isHost && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted/50 border border-border text-foreground text-sm font-bold hover:bg-muted transition-all"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Edit Party</span>
                </button>
                <button
                  onClick={handleDeleteJam}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:inline">Delete Party</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Player Focus Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-reaction text-2xl md:text-4xl"
                style={{ left: `${40 + Math.random() * 20}%` }}
              >
                {r.reaction}
              </div>
            ))}
          </div>

          <div className="max-w-sm md:max-w-md w-full space-y-4 md:space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 group bg-muted">
              <Image
                src={(playerTrack?.coverUrl || jam.currentTrack?.coverUrl) 
                  ? `/api/stream/image/${playerTrack?.coverUrl || jam.currentTrack?.coverUrl}` 
                  : "/default-cover.jpg"}
                alt={playerTrack?.title || jam.currentTrack?.title || "Cover"}
                fill
                className="object-cover"
              />
              
              {!isHost && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium px-6 text-center text-sm md:text-base">
                    Listening along with {jam.host.username}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center space-y-2 px-4">
              <h2 className="text-xl md:text-3xl font-black text-foreground tracking-tight truncate">
                {playerTrack?.title || jam.currentTrack?.title || "No track playing"}
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground font-medium truncate">
                {playerTrack?.creator?.username || jam.currentTrack?.creator?.username || "Add some music to the queue"}
              </p>
            </div>

            {/* Host Controls */}
            {isHost && jam.currentTrack && (
              <div className="flex items-center justify-center gap-6 py-4">
                <button 
                  onClick={() => toggleShuffle()} 
                  className={`p-2 transition-colors ${shuffle ? "text-primary-500" : "text-muted-foreground hover:text-foreground"}`}
                  title="Shuffle"
                >
                  <Shuffle className="h-5 w-5" />
                </button>
                <button 
                  onClick={handlePrevious} 
                  className="p-2 text-foreground hover:text-primary-500 transition-colors"
                  title="Previous"
                >
                  <SkipBack className="h-8 w-8 fill-current" />
                </button>
                <button 
                  onClick={handleTogglePlay}
                  className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg shadow-primary-500/25 active:scale-95"
                  title={isPlayerPlaying ? "Pause" : "Play"}
                >
                  {isPlayerPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                </button>
                <button 
                  onClick={handleNext} 
                  className="p-2 text-foreground hover:text-primary-500 transition-colors"
                  title="Next"
                >
                  <SkipForward className="h-8 w-8 fill-current" />
                </button>
                <button 
                  onClick={() => toggleRepeat()} 
                  className={`p-2 transition-colors ${repeat !== "off" ? "text-primary-500" : "text-muted-foreground hover:text-foreground"}`}
                  title="Repeat"
                >
                  {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                </button>
              </div>
            )}

            <div className="flex justify-center gap-4 md:gap-6 pt-2 md:pt-4">
              <button
                onClick={() => handleSendReaction("🔥")}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted hover:scale-110 active:scale-95 transition-all text-xl md:text-2xl"
              >
                🔥
              </button>
              <button
                onClick={() => handleSendReaction("❤️")}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted hover:scale-110 active:scale-95 transition-all text-xl md:text-2xl"
              >
                ❤️
              </button>
              <button
                onClick={() => handleSendReaction("👏")}
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted hover:scale-110 active:scale-95 transition-all text-xl md:text-2xl"
              >
                👏
              </button>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        <div className="p-6 border-t border-border pb-32 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-3 tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Music className="h-4 w-4 text-primary-500" />
              </div>
              Up Next
            </h3>
            {isHost && (
              <button 
                onClick={() => setIsAddTrackModalOpen(true)}
                className="group flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                Add Tracks
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {jam.queue.length > 0 ? (
              jam.queue.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-card hover:bg-accent border border-border transition-all group">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 shadow-lg bg-muted">
                    <Image
                      src={item.track.coverUrl ? `/api/stream/image/${item.track.coverUrl}` : "/default-cover.jpg"}
                      fill
                      className="object-cover"
                      alt=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.track.title}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate">{item.track.genre}</p>
                  </div>
                  {isHost && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleReorderTrack(item.id, "up")}
                        className="p-1.5 text-muted-foreground hover:text-primary-500 hover:bg-accent rounded-lg transition-all"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleReorderTrack(item.id, "down")}
                        className="p-1.5 text-muted-foreground hover:text-primary-500 hover:bg-accent rounded-lg transition-all"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTrack(item.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 rounded-[2rem] bg-muted/20 border border-dashed border-border text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-6">The queue is empty. Start the party!</p>
                {isHost && (
                  <button
                    onClick={() => setIsAddTrackModalOpen(true)}
                    className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-primary-600 text-white font-black text-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    Add Your First Track
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Chat & Members - Desktop */}
      <div className="hidden md:flex w-80 border-l border-border flex-col bg-card/95 backdrop-blur-xl">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/50">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "chat" ? "border-b-2 border-primary-500 text-foreground bg-background" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}
          >
            💬 Live Chat
          </button>
          <button 
            onClick={() => setActiveTab("listeners")}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "listeners" ? "border-b-2 border-primary-500 text-foreground bg-background" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}
          >
            👥 Listeners
          </button>
        </div>

        {/* Chat Messages */}
        {activeTab === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background">
              {jamMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No messages yet</p>
                  <p className="text-muted-foreground/50 text-xs mt-1">Be the first to say something!</p>
                </div>
              )}
              {jamMessages.map((msg, i) => (
                <div key={i} className="space-y-1 animate-in fade-in slide-in-from-right-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary-500">{msg.username}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground bg-muted rounded-2xl rounded-tl-none px-3 py-2 border border-border">
                    {msg.content}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-muted/30 relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-full mb-2 right-0 z-50"
                >
                  <Picker 
                    data={data} 
                    onEmojiSelect={addEmoji}
                    theme="auto"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something..."
                  className="flex-1 rounded-2xl bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full disabled:opacity-30 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-background">
            {jam.members.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No listeners yet</p>
              </div>
            )}
            {jam.members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-500">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{member.user.username}</span>
                  {member.role === "HOST" && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                {isHost && member.userId !== session?.user?.id && (
                  <button 
                    onClick={() => promoteToHost(member.userId)}
                    className="px-3 py-1.5 bg-background hover:bg-muted rounded-lg text-[10px] font-bold text-primary-500 transition-colors border border-border"
                  >
                    MAKE HOST
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet - Chat & Members */}
      <div className={`md:hidden fixed inset-x-0 bottom-0 bg-card/95 backdrop-blur-2xl border-t border-border rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out z-[55] ${isChatOpen ? "translate-y-0" : "translate-y-[calc(100%-4rem)]"}`}>
        {/* Handle / Header */}
        <div 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-full py-4 flex flex-col items-center gap-1.5 cursor-pointer active:bg-white/5 transition-colors rounded-t-[2.5rem]"
        >
          <div className="w-12 h-1.5 bg-muted rounded-full opacity-50" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{isChatOpen ? "Hide Chat" : "Show Chat & Listeners"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "chat" ? "border-b-2 border-primary-500 text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground"}`}
          >
            💬 Chat
          </button>
          <button 
            onClick={() => setActiveTab("listeners")}
            className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === "listeners" ? "border-b-2 border-primary-500 text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground"}`}
          >
            👥 Listeners
          </button>
        </div>

        {/* Content */}
        <div className="h-[60dvh] overflow-hidden">
          {activeTab === "chat" ? (
            <div className="h-full flex flex-col bg-background">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {jamMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No messages yet</p>
                    <p className="text-muted-foreground/50 text-xs mt-1">Be the first to say something!</p>
                  </div>
                )}
                {jamMessages.map((msg, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-primary-500">{msg.username}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground bg-muted rounded-2xl rounded-tl-none px-3 py-2 border border-border">
                      {msg.content}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Mobile Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-muted/30 relative">
                {/* Mobile Emoji Picker */}
                {showMobileEmojiPicker && (
                  <div 
                    ref={mobileEmojiPickerRef}
                    className="absolute bottom-full mb-2 left-0 right-0 flex justify-center z-50"
                  >
                    <Picker 
                      data={data} 
                      onEmojiSelect={addEmoji}
                      theme="auto"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMobileEmojiPicker(!showMobileEmojiPicker)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 rounded-2xl bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full disabled:opacity-30 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 space-y-2 custom-scrollbar bg-background">
              {jam.members.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No listeners yet</p>
                </div>
              )}
              {jam.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-500/10 flex items-center justify-center text-sm font-bold text-primary-500">
                      {member.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{member.user.username}</span>
                    {member.role === "HOST" && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  {isHost && member.userId !== session?.user?.id && (
                    <button 
                      onClick={() => promoteToHost(member.userId)}
                      className="px-3 py-1.5 bg-background hover:bg-muted rounded-lg text-[10px] font-bold text-primary-500 transition-colors border border-border"
                    >
                      HOST
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes reaction {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -400px) scale(1.5); opacity: 0; }
        }
        .animate-reaction {
          animation: reaction 3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>

      {/* Add Track Modal */}
      <AddTrackModal
        isOpen={isAddTrackModalOpen}
        onClose={() => setIsAddTrackModalOpen(false)}
        jamId={id}
        onTrackAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["jam", id] })
          setIsAddTrackModalOpen(false)
        }}
      />
      <EditJamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        jamId={id}
        initialName={jam.name}
        initialIsPublic={jam.isPublic}
      />
    </div>
  )
}
