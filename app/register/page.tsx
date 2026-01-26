// app/register/page.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Music } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Registration failed")
        return
      }

      toast.success("Account created successfully!")

      // Redirect to login
      router.push("/login?registered=true")
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 mb-4">
          <Music className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold">MusicaHub</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-muted-foreground">Join the music community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="johndoe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-500 hover:underline">
          Login here
        </Link>
      </p>
      </div>
    </div>
  )
}