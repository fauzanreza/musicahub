"use client"

import { useState, useEffect } from "react"
import { X, Globe, Lock, Loader2, Sparkles, Save } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface EditJamModalProps {
  isOpen: boolean
  onClose: () => void
  jamId: string
  initialName: string
  initialIsPublic: boolean
}

export function EditJamModal({ isOpen, onClose, jamId, initialName, initialIsPublic }: EditJamModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialName)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setName(initialName)
    setIsPublic(initialIsPublic)
  }, [initialName, initialIsPublic, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a name for your party")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/jams/${jamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), isPublic }),
      })

      if (!response.ok) throw new Error("Failed to update jam")

      toast.success("Listening Party updated!")
      queryClient.invalidateQueries({ queryKey: ["jam", jamId] })
      onClose()
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary-500/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-purple-500/10 blur-[100px]" />

        <div className="flex items-center justify-between p-8 border-b border-border relative">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight text-foreground">
              <Sparkles className="h-6 w-6 text-primary-500" />
              Edit Party
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Settings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors border border-border"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 relative">
          <div className="space-y-3">
            <label className="text-sm font-bold text-muted-foreground ml-1">
              Party Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Chill Session"
              className="w-full rounded-2xl bg-muted/30 border border-input px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-muted-foreground/40 text-lg font-bold text-foreground"
              autoFocus
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-muted-foreground ml-1">
              Privacy Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${
                  isPublic
                    ? "bg-primary-500/10 border-primary-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                    : "bg-muted/30 border-input text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/20"
                }`}
              >
                <div className={`p-3 rounded-xl ${isPublic ? "bg-primary-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Globe className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <span className={`block text-sm font-bold ${isPublic ? "text-foreground" : ""}`}>Public</span>
                  <span className="text-[10px] opacity-60">Visible on Home</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${
                  !isPublic
                    ? "bg-purple-500/10 border-purple-500 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
                    : "bg-muted/30 border-input text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/20"
                }`}
              >
                <div className={`p-3 rounded-xl ${!isPublic ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Lock className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <span className={`block text-sm font-bold ${!isPublic ? "text-foreground" : ""}`}>Private</span>
                  <span className="text-[10px] opacity-60">Invite via Code</span>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full group relative flex items-center justify-center gap-3 rounded-2xl bg-primary-600 py-5 font-black text-white shadow-xl shadow-primary-600/20 hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                Save Changes
                <Save className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
