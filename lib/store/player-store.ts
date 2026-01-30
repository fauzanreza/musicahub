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
  jamTrackId?: string // Specifically for Jam queues to identify unique instances
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
  activeJamId: string | null
  isHost: boolean
  isPlayerVisible: boolean
  jamMessages: any[]
  reactions: any[]

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
  setActiveJam: (jamId: string | null, isHost: boolean) => void
  setIsPlayerVisible: (isVisible: boolean) => void
  clearQueue: () => void
  leaveJam: () => void
  addJamMessage: (message: any) => void
  setJamMessages: (messages: any[]) => void
  addReaction: (reaction: any) => void
  clearJamData: () => void
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
      activeJamId: null,
      isHost: false,
      isPlayerVisible: false,
      jamMessages: [],
      reactions: [],

      setCurrentTrack: (track) => {
        const { howl, activeJamId, isHost } = get()
        
        // If in a Jam and not the host, don't allow manual track changes
        // The user must leave the jam first
        if (activeJamId && !isHost) {
          return
        }

        if (howl) {
          howl.unload()
        }
        set({ howl: null, currentTrack: track, isPlaying: true, currentTime: 0, isExpanded: true, isLoading: true, isPlayerVisible: true })
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
        } else {
          // Circular: wrap around to the first track
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
        } else {
          // Circular: wrap around to the last track
          setCurrentTrack(queue[queue.length - 1])
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

      setActiveJam: (jamId, isHost) => {
        const currentJamId = get().activeJamId
        if (currentJamId !== jamId) {
          set({ activeJamId: jamId, isHost, jamMessages: [], reactions: [] })
        } else {
          set({ isHost })
        }
      },

      leaveJam: () => {
        const { howl } = get()
        if (howl) {
          howl.unload()
        }
        set({ 
          activeJamId: null, 
          isHost: false, 
          currentTrack: null, 
          isPlaying: false, 
          howl: null,
          currentTime: 0,
          duration: 0,
          jamMessages: [],
          reactions: []
        })
      },

      setIsPlayerVisible: (isVisible) => set({ isPlayerVisible: isVisible }),

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

      addJamMessage: (message) => set((state) => ({ 
        jamMessages: [...state.jamMessages, message] 
      })),

      setJamMessages: (messages) => set({ jamMessages: messages }),

      addReaction: (reaction) => {
        const id = Math.random()
        set((state) => ({ 
          reactions: [...state.reactions, { ...reaction, id }] 
        }))
        setTimeout(() => {
          set((state) => ({ 
            reactions: state.reactions.filter((r) => r.id !== id) 
          }))
        }, 3000)
      },

      clearJamData: () => set({ jamMessages: [], reactions: [] }),
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
        activeJamId: state.activeJamId,
        isHost: state.isHost,
      }),
    }
  )
)