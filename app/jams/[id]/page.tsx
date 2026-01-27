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
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { useSocket } from "@/hooks/use-socket"
import { usePlayerStore } from "@/lib/store/player-store"

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
    setActiveJam
  } = usePlayerStore()

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [reactions, setReactions] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"chat" | "listeners">("chat")
  
  const chatEndRef = useRef<HTMLDivElement>(null)

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

    socket.on("new-message", (msg: any) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on("new-reaction", (reaction: any) => {
      setReactions((prev) => [...prev, { ...reaction, id: Math.random() }])
      // Remove reaction after animation
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
      }, 3000)
    })

    socket.on("playback-state", (state: any) => {
      if (isHost) return // Host doesn't follow

      const { track, isPlaying, seekPosition, timestamp } = state
      const latency = (Date.now() - timestamp) / 1000
      const targetPosition = seekPosition + latency

      // Sync track if different
      if (playerTrack?.id !== track?.id && track) {
        setCurrentTrack(track)
      }

      // Sync play/pause
      if (isPlaying && !isPlayerPlaying) play()
      if (!isPlaying && isPlayerPlaying) pause()

      // Sync position
      if (Math.abs(currentTime - targetPosition) > 2) {
        seek(targetPosition)
      }
    })

    return () => {
      socket.emit("leave-jam", jam.id)
      setActiveJam(null, false)
      socket.off("new-message")
      socket.off("new-reaction")
      socket.off("playback-state")
    }
  }, [socket, jam, isHost])

  // Host: Broadcast playback state
  useEffect(() => {
    if (!isHost || !socket || !jam || !playerTrack) return

    const interval = setInterval(() => {
      socket.emit("sync-playback", {
        jamId: jam.id,
        state: {
          track: playerTrack,
          isPlaying: isPlayerPlaying,
          seekPosition: currentTime,
          timestamp: Date.now(),
        },
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isHost, socket, jam, playerTrack, isPlayerPlaying, currentTime])

  // Set active jam in store
  useEffect(() => {
    if (jam && session?.user) {
      setActiveJam(jam.id, isHost)
    }
  }, [jam, session, isHost, setActiveJam])

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !socket || !session) return

    const msg = {
      userId: session.user?.id,
      username: session.user?.name,
      content: message,
      createdAt: new Date().toISOString(),
    }

    socket.emit("send-message", { jamId: jam.id, message: msg })
    setMessage("")
  }

  const handleSendReaction = (type: string) => {
    const userId = session?.user?.id
    if (!socket || !userId) return
    socket.emit("send-reaction", { jamId: jam.id, reaction: type, userId })
  }

  const copyRoomCode = () => {
    if (!jam?.roomCode) return
    navigator.clipboard.writeText(jam.roomCode)
    setCopied(true)
    toast.success("Room code copied!")
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Music className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{jam.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  {jam.host.username}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {jam.members.length} listening
                </span>
              </div>
            </div>
          </div>

          {jam.roomCode && (
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all border border-white/10"
            >
              <span className="text-muted-foreground">Code:</span>
              <span className="font-mono font-bold text-primary-500">{jam.roomCode}</span>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Player Focus Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Reaction Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-reaction text-4xl"
                style={{ left: `${40 + Math.random() * 20}%` }}
              >
                {r.reaction === "fire" && "🔥"}
                {r.reaction === "heart" && "❤️"}
                {r.reaction === "clap" && "👏"}
              </div>
            ))}
          </div>

          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 group">
              {jam.currentTrack?.coverUrl ? (
                <img
                  src={jam.currentTrack.coverUrl}
                  alt={jam.currentTrack.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary-500/20 to-primary-900/20 flex items-center justify-center">
                  <Music className="h-24 w-24 text-primary-500/20" />
                </div>
              )}
              
              {!isHost && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium px-6 text-center">
                    Listening along with {jam.host.username}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold truncate">
                {jam.currentTrack?.title || "No track playing"}
              </h2>
              <p className="text-muted-foreground">
                {jam.currentTrack?.creator?.username || "Add some music to the queue"}
              </p>
            </div>

            {/* Live Reactions Buttons */}
            <div className="flex justify-center gap-6 pt-4">
              <button
                onClick={() => handleSendReaction("fire")}
                className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all text-2xl"
              >
                🔥
              </button>
              <button
                onClick={() => handleSendReaction("heart")}
                className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all text-2xl"
              >
                ❤️
              </button>
              <button
                onClick={() => handleSendReaction("clap")}
                className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all text-2xl"
              >
                👏
              </button>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Music className="h-4 w-4 text-primary-500" />
              Up Next
            </h3>
            {isHost && (
              <button className="text-xs font-medium text-primary-500 hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Add Tracks
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {jam.queue.length > 0 ? (
              jam.queue.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                  <img
                    src={item.track.coverUrl || ""}
                    className="h-10 w-10 rounded-lg object-cover"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.track.genre}</p>
                  </div>
                  {isHost && (
                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 italic">
                Queue is empty
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Chat & Members */}
      <div className={`w-80 border-l border-white/5 flex flex-col bg-card/30 backdrop-blur-xl transition-all ${isChatOpen ? "mr-0" : "-mr-80"}`}>
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "chat" ? "border-b-2 border-primary-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Live Chat
          </button>
          <button 
            onClick={() => setActiveTab("listeners")}
            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "listeners" ? "border-b-2 border-primary-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Listeners
          </button>
        </div>

        {/* Chat Messages */}
        {activeTab === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className="space-y-1 animate-in fade-in slide-in-from-right-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary-400">{msg.username}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm bg-white/5 rounded-2xl rounded-tl-none px-3 py-2 border border-white/5">
                    {msg.content}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something..."
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-500 disabled:opacity-30 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {jam.members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{member.user.username}</span>
                  {member.role === "HOST" && <Crown className="h-3 w-3 text-yellow-500" />}
                </div>
                {isHost && member.userId !== session?.user?.id && (
                  <button 
                    onClick={() => promoteToHost(member.userId)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-primary-500"
                  >
                    MAKE HOST
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Toggle Button (Mobile/Small screens) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-24 right-6 h-12 w-12 rounded-full bg-primary-600 text-white shadow-xl flex items-center justify-center md:hidden z-50"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

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
    </div>
  )
}
