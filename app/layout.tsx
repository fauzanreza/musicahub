// app/layout.tsx

import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { AuthProvider } from "@/components/providers/session-provider"
import { Navbar } from "@/components/layout/navbar"
import { Player } from "@/components/player/player"
import { Toaster } from "sonner"

const inter = localFont({
  src: "./fonts/Inter/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-inter",
})

const girassol = localFont({
  src: "./fonts/Girassol/Girassol-Regular.ttf",
  variable: "--font-girassol",
})

export const metadata: Metadata = {
  title: "MusicaHub - Democratic Music Streaming",
  description: "Platform streaming musik hybrid yang demokratis",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${girassol.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <Toaster richColors closeButton position="top-right" />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 pb-24">{children}</main>
                <Player />
              </div>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}