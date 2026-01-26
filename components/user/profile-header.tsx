
"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Music, Heart, Calendar, User as UserIcon, Edit2, Camera, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProfileHeaderProps {
  user: {
    id: string
    username: string
    bio: string | null
    avatar: string | null
    createdAt: Date
    _count: {
      tracks: number
    }
  }
  isOwner: boolean
  totalLikes: number
}

export function ProfileHeader({ user, isOwner, totalLikes }: ProfileHeaderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio || "",
    avatar: user.avatar,
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadData = new FormData()
    uploadData.append("file", file)

    const toastId = toast.loading("Uploading avatar...")

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setFormData(prev => ({ ...prev, avatar: `/api/stream/image/${data.filename}` }))
      toast.success("Avatar uploaded", { id: toastId })
    } catch (error) {
      toast.error("Failed to upload avatar", { id: toastId })
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
      setIsEditing(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl relative group">
        {isOwner && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              fill
              className="object-cover rounded-full border-4 border-primary-500/20"
            />
          ) : (
            <div className="w-full h-full bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20">
              <UserIcon className="w-16 h-16 text-primary-500" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.username}</h1>
            <p className="text-muted-foreground text-lg">{user.bio || "No bio yet."}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <Music className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-foreground">{user._count.tracks}</span> Songs
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-foreground">{totalLikes}</span> Likes Received
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5 text-blue-500" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-background border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 pb-2 border-b border-white/5">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative w-24 h-24 group cursor-pointer">
                  {formData.avatar ? (
                    <Image
                      src={formData.avatar}
                      alt="Avatar"
                      fill
                      className="object-cover rounded-full border-2 border-primary-500/50"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-500/10 rounded-full flex items-center justify-center border-2 border-primary-500/50">
                      <UserIcon className="w-10 h-10 text-primary-500" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-primary-500 transition-colors min-h-[100px] resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
