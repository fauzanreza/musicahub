// app/login/page.tsx

"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Music } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        router.push("/")
        router.refresh()
      }
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
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Login to your account</p>
        </div>
        
        {/* Form starts here */}

      <form onSubmit={handleSubmit} className="space-y-4">


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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary-500 hover:underline">
          Register here
        </Link>
      </p>
      </div>
    </div>
  )
}