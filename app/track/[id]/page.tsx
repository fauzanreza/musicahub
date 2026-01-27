
"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlayerStore } from "@/lib/store/player-store"
import { Music } from "lucide-react"

export default function TrackSharePage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { setCurrentTrack, setIsExpanded } = usePlayerStore()

  useEffect(() => {
    const fetchAndPlay = async () => {
      try {
        const res = await fetch(`/api/tracks/${id}`)
        if (res.ok) {
          const track = await res.json()
          setCurrentTrack(track)
          setIsExpanded(true)
          // Redirect to home so the player stays visible but the URL is clean
          router.replace("/")
        } else {
          router.replace("/404")
        }
      } catch (error) {
        console.error("Error fetching shared track:", error)
        router.replace("/")
      }
    }

    if (id) {
      fetchAndPlay()
    }
  }, [id, setCurrentTrack, setIsExpanded, router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 bg-primary-500/20 rounded-full flex items-center justify-center animate-pulse">
          <Music className="h-8 w-8 text-primary-500" />
        </div>
        <div className="absolute inset-0 h-16 w-16 bg-primary-500/10 rounded-full animate-ping" />
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading shared track...</p>
    </div>
  )
}
