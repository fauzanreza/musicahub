"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Radio, Users, Plus, ArrowRight, Loader2, Sparkles, Search, Lock, Globe } from "lucide-react"
import { JamCard } from "@/components/jams/jam-card"
import { CreateJamModal } from "@/components/jams/create-jam-modal"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ListeningPartyHub() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const { data: liveJams, isLoading: isLoadingJams } = useQuery<any[]>({
    queryKey: ["jams", "live"],
    queryFn: async () => {
      const res = await fetch("/api/jams")
      if (!res.ok) throw new Error("Failed to fetch jams")
      return res.json()
    },
    refetchInterval: 10000,
  })

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.length !== 6) return

    setIsJoining(true)
    try {
      const response = await fetch("/api/jams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Invalid room code")
      }

      const { jamId } = await response.json()
      toast.success("Joining party...")
      router.push(`/jams/${jamId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Section - Premium Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 pt-12 md:pt-20 pb-16 md:pb-32 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-[300px] w-[300px] md:h-[500px] md:w-[500px] bg-white/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-[250px] w-[250px] md:h-[400px] md:w-[400px] bg-purple-400/20 blur-[100px] rounded-full" />
        
        <div className="container relative px-4 mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-4 md:mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              LIVE INTERACTION
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white mb-4 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              Listening <span className="text-primary-200">Party</span>
            </h1>
            <p className="text-base md:text-xl lg:text-2xl text-primary-50/80 mb-6 md:mb-12 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700">
              Experience music together in real-time. Join public sessions or create your own private room for friends.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-white text-primary-600 font-black hover:bg-primary-50 transition-all shadow-2xl shadow-black/20 active:scale-95"
              >
                <Plus className="h-5 w-5 md:h-6 md:w-6" />
                Create Your Party
              </button>
              
              <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative group w-full sm:w-auto">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    maxLength={6}
                    className="w-full sm:w-48 md:w-64 px-4 md:px-6 py-4 md:py-5 rounded-2xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-mono font-black tracking-[0.2em] text-center text-white placeholder:text-white/30 text-base md:text-lg backdrop-blur-md"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || roomCode.length !== 6}
                  className="w-full sm:w-auto p-4 md:p-5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all disabled:opacity-30 backdrop-blur-md shadow-xl flex items-center justify-center"
                >
                  {isJoining ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 mx-auto -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-card border border-border shadow-xl space-y-6 md:space-y-8 lg:sticky lg:top-24">
              <div className="space-y-2">
                <h3 className="font-black text-xl md:text-2xl flex items-center gap-3 tracking-tight">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  How it works
                </h3>
                <p className="text-sm text-muted-foreground">Three steps to start vibing.</p>
              </div>
              
              <ul className="space-y-4 md:space-y-6">
                <li className="flex gap-3 md:gap-4">
                  <div className="h-8 w-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-xs font-black text-primary-500 shrink-0 border border-primary-500/20">1</div>
                  <p className="text-sm font-medium leading-relaxed">Create a room and invite your friends with a unique 6-digit code.</p>
                </li>
                <li className="flex gap-3 md:gap-4">
                  <div className="h-8 w-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-xs font-black text-primary-500 shrink-0 border border-primary-500/20">2</div>
                  <p className="text-sm font-medium leading-relaxed">The host controls the music, everyone hears it at the exact same second.</p>
                </li>
                <li className="flex gap-3 md:gap-4">
                  <div className="h-8 w-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-xs font-black text-primary-500 shrink-0 border border-primary-500/20">3</div>
                  <p className="text-sm font-medium leading-relaxed">Chat live, send reactions, and vibe together in real-time.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Jams List */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8 order-1 lg:order-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <span className="text-white">Live Now</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {liveJams?.reduce((acc: number, jam: any) => acc + jam._count.members, 0) || 0} people jamming
              </div>
            </div>

            {isLoadingJams ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl md:rounded-3xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : liveJams && liveJams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {liveJams.map((jam) => (
                  <JamCard key={jam.id} jam={jam} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 px-6 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/5 flex items-center justify-center mb-4 md:mb-6">
                  <Radio className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">No public parties yet</h3>
                <p className="text-sm md:text-base text-muted-foreground max-w-xs mb-6 md:mb-8">
                  Be the first to start a public listening party and invite the community!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm md:text-base"
                >
                  Start First Party
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateJamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
