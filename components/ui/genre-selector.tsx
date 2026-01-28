"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

const DEFAULT_GENRES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Electronic",
  "Jazz",
  "Classical",
  "R&B",
  "Country",
  "Indie",
  "Alternative",
]

interface GenreSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export function GenreSelector({ value, onChange, disabled, required, className = "" }: GenreSelectorProps) {
  const [customGenres, setCustomGenres] = useState<string[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customGenreInput, setCustomGenreInput] = useState("")

  const allGenres = [...DEFAULT_GENRES, ...customGenres]

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim()
    if (trimmed && !allGenres.includes(trimmed)) {
      setCustomGenres([...customGenres, trimmed])
      onChange(trimmed)
      setCustomGenreInput("")
      setShowCustomInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCustomGenre()
    } else if (e.key === "Escape") {
      setShowCustomInput(false)
      setCustomGenreInput("")
    }
  }

  return (
    <div className={className}>
      {!showCustomInput ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            required={required}
            disabled={disabled}
          >
            <option value="">Select a genre</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            disabled={disabled}
            className="px-4 py-2 rounded-lg border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            title="Add custom genre"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Genre</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customGenreInput}
            onChange={(e) => setCustomGenreInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter custom genre..."
            className="flex-1 px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary-500 outline-none"
            autoFocus
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleAddCustomGenre}
            disabled={!customGenreInput.trim() || disabled}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false)
              setCustomGenreInput("")
            }}
            disabled={disabled}
            className="px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {customGenres.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Custom genres:</span>
          {customGenres.map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs"
            >
              {genre}
              <button
                type="button"
                onClick={() => {
                  setCustomGenres(customGenres.filter((g) => g !== genre))
                  if (value === genre) onChange("")
                }}
                disabled={disabled}
                className="hover:bg-primary-500/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
