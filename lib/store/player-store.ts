import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Howl } from 'howler'

export interface Track {
  id: string
  title: string
  audioUrl: string
  coverUrl: string | null
  genre: string
  creator: {
    id: string
    username: string
    avatar: string | null
  }
  votes?: {
    ups: number
    downs: number
  }
  isLiked?: boolean
}

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  repeat: 'off' | 'one' | 'all'
  shuffle: boolean
  isExpanded: boolean
  howl: Howl | null
  isLoading: boolean

  // Actions
  setCurrentTrack: (track: Track) => void
  setQueue: (tracks: Track[]) => void
  setIsExpanded: (isExpanded: boolean) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setHowl: (howl: Howl | null) => void
  setIsLoading: (isLoading: boolean) => void
  clearQueue: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      repeat: 'off',
      shuffle: false,
      isExpanded: false,
      howl: null,
      isLoading: false,

      setCurrentTrack: (track) => {
        const { howl } = get()
        if (howl) {
          howl.unload()
        }
        set({ currentTrack: track, isPlaying: true, currentTime: 0, isExpanded: true, isLoading: true })
      },

      setQueue: (tracks) => set({ queue: tracks }),

      setIsExpanded: (isExpanded) => set({ isExpanded }),

      play: () => {
        const { howl } = get()
        if (howl) {
          howl.play()
          set({ isPlaying: true })
        }
      },

      pause: () => {
        const { howl } = get()
        if (howl) {
          howl.pause()
          set({ isPlaying: false })
        }
      },

      togglePlay: () => {
        const { isPlaying, play, pause } = get()
        if (isPlaying) {
          pause()
        } else {
          play()
        }
      },

      next: () => {
        const { queue, currentTrack, setCurrentTrack, repeat, shuffle } = get()
        if (!currentTrack || queue.length === 0) return

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id)
        
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * queue.length)
          setCurrentTrack(queue[randomIndex])
        } else if (currentIndex < queue.length - 1) {
          setCurrentTrack(queue[currentIndex + 1])
        } else if (repeat === 'all') {
          setCurrentTrack(queue[0])
        }
      },

      previous: () => {
        const { queue, currentTrack, setCurrentTrack, currentTime } = get()
        if (!currentTrack || queue.length === 0) return

        // If more than 3 seconds, restart current track
        if (currentTime > 3) {
          get().seek(0)
          get().play()
          return
        }

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id)
        if (currentIndex > 0) {
          setCurrentTrack(queue[currentIndex - 1])
        }
      },

      seek: (time) => {
        const { howl } = get()
        if (howl) {
          howl.seek(time)
          set({ currentTime: time })
        }
      },

      setVolume: (volume) => {
        const { howl } = get()
        if (howl) {
          howl.volume(volume)
        }
        set({ volume })
      },

      toggleRepeat: () => {
        const { repeat } = get()
        const nextRepeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'
        set({ repeat: nextRepeat })
      },

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

      setCurrentTime: (time) => set({ currentTime: time }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setDuration: (duration) => set({ duration }),

      setHowl: (howl) => set({ howl }),

      clearQueue: () => {
        const { howl } = get()
        if (howl) {
          howl.unload()
        }
        set({ 
          currentTrack: null, 
          queue: [], 
          isPlaying: false, 
          howl: null,
          currentTime: 0,
          duration: 0,
          isLoading: false
        })
      },
    }),
    {
      name: 'musica-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        volume: state.volume,
        repeat: state.repeat,
        shuffle: state.shuffle,
        isPlaying: state.isPlaying,
      }),
    }
  )
)