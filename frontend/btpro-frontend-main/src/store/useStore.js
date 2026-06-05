import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            cabinet: null,
            theme: 'light',
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setCabinet: (cabinet) => set({ cabinet }),
            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme)
                set({ theme })
            },
            logout: () => set({ user: null, token: null, cabinet: null }),
        }),
        {
            name: 'planner-storage',
            onRehydrateStorage: () => (state) => {
                if (state?.theme) {
                    document.documentElement.setAttribute('data-theme', state.theme)
                }
            },
        }
    )
)

export default useStore
