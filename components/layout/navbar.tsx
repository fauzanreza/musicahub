// components/layout/navbar.tsx

"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, Music, Search, Home, Upload, User, Menu, X, Library } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 group-hover:bg-primary-500/30 transition-colors">
            <Music className="h-5 w-5 text-primary-500" />
          </div>
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent font-extrabold tracking-tight">
            MusicaHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Home" />
          <NavLink href="/explore" icon={<Search className="h-4 w-4" />} label="Explore" />
          {session && (
            <>
              <NavLink href="/library" icon={<Library className="h-4 w-4" />} label="Library" />
              <NavLink href="/upload" icon={<Upload className="h-4 w-4" />} label="Upload" />
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4 transition-all" />
              ) : (
                <Moon className="h-4 w-4 transition-all" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          {session ? (
            <Link
              href={`/user/${session.user?.id}`}
              className="flex items-center gap-2 rounded-full bg-primary-500/10 pl-1 pr-4 py-1 text-sm font-medium text-primary-500 hover:bg-primary-500/20 transition-colors border border-primary-500/20"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white">
                <User className="h-4 w-4" />
              </div>
              <span>{session.user?.name?.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 space-y-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col gap-2">
            <MobileNavLink href="/" icon={<Home className="h-4 w-4" />} label="Home" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileNavLink href="/explore" icon={<Search className="h-4 w-4" />} label="Explore" onClick={() => setIsMobileMenuOpen(false)} />
            {session && (
              <>
                <MobileNavLink href="/library" icon={<Library className="h-4 w-4" />} label="Library" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink href="/upload" icon={<Upload className="h-4 w-4" />} label="Upload" onClick={() => setIsMobileMenuOpen(false)} />
              </>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Appearance</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-accent text-accent-foreground"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="pt-2">
            {session ? (
              <Link
                href={`/user/${session.user?.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-primary-500/10 p-3 text-primary-500"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{session.user?.name}</span>
                  <span className="text-xs opacity-70">View Profile</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-lg bg-primary-600 p-3 font-medium text-white hover:bg-primary-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-500"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}