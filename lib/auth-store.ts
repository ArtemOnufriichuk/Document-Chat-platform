import { create } from "zustand"
import { readDB, updateDB } from "./db"
import type { User } from "@/types"

type AuthStore = {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: (username, password) => {
    const db = readDB()
    const user = db.users.find((u) => u.login === username && u.password === password)
    if (user) {
      set({ user: { id: user.id, login: user.login, isAdmin: user.isAdmin } as User })
      updateDB((db) => {
        db.users = db.users.map((u) => (u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u))
        return db
      })
      return true
    }
    return false
  },
  logout: () => set({ user: null }),
}))

