"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function JoinJamPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.length !== 6) {
      toast.error("Room code must be 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/jams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to join jam")
      }

      const { jamId } = await response.json()
      toast.success("Joined jam successfully!")
      router.push(`/jams/${jamId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join a Jam</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit room code to join your friends.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            maxLength={6}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-5 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-muted-foreground/30"
            required
          />
          
          <button
            type="submit"
            disabled={isLoading || roomCode.length !== 6}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Join Party
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-sm text-muted-foreground">
          Don't have a code? Ask the host for the 6-digit room code.
        </p>
      </div>
    </div>
  )
}
