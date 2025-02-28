import { create } from "zustand"
import { readDB, updateDB } from "./db"
import type { User, Document, Report, Bonus, Affiliate } from "@/types"

interface AuthStore {
  currentUser: User | null
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (user: Omit<User, "id" | "createdAt" | "lastLogin">) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void
  changeUserPermissions: (id: string, isAdmin: boolean) => void
  documents: Document[]
  addDocument: (document: Omit<Document, "id" | "createdAt" | "updatedAt" | "history">) => Promise<void>
  updateDocument: (id: string, document: Partial<Document>) => void
  removeDocument: (id: string) => void
  addDocumentHistory: (documentId: string, changedBy: string, changes: string) => void
  reports: Report[]
  addReport: (report: Omit<Report, "id">) => void
  updateReport: (id: string, report: Partial<Report>) => void
  deleteReport: (id: string) => void
  bonuses: Bonus[]
  addBonus: (bonus: Omit<Bonus, "id" | "isUsed">) => void
  updateBonus: (id: string, bonus: Partial<Bonus>) => void
  deleteBonus: (id: string) => void
  markBonusAsUsed: (id: string, userId: string) => void
  affiliates: Affiliate[]
  addAffiliate: (affiliate: Omit<Affiliate, "id">) => void
  updateAffiliate: (id: string, affiliate: Partial<Affiliate>) => void
  deleteAffiliate: (id: string) => void
  fetchUsers: () => Promise<void>
  fetchDocuments: () => Promise<void>
}

export const useAppStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  users: readDB().users,
  login: (username, password) => {
    const user = get().users.find((u) => u.login === username && u.password === password)
    if (user) {
      set({ currentUser: user })
      updateDB((db) => {
        const updatedUser = { ...user, lastLogin: new Date().toISOString() }
        db.users = db.users.map((u) => (u.id === user.id ? updatedUser : u))
        return db
      })
      return true
    }
    return false
  },
  logout: () => set({ currentUser: null }),
  addUser: async (user) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    if (response.ok) {
      get().fetchUsers()
    } else {
      throw new Error("Failed to add user")
    }
  },
  updateUser: (id, updatedUser) => {
    updateDB((db) => {
      db.users = db.users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user))
      return db
    })
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user)),
    }))
  },
  deleteUser: (id) => {
    updateDB((db) => {
      db.users = db.users.filter((user) => user.id !== id)
      return db
    })
    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
    }))
  },
  changeUserPermissions: (id, isAdmin) => {
    updateDB((db) => {
      db.users = db.users.map((user) => (user.id === id ? { ...user, isAdmin } : user))
      return db
    })
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, isAdmin } : user)),
    }))
  },
  documents: [],
  addDocument: async (document) => {
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    })
    if (response.ok) {
      get().fetchDocuments()
    } else {
      throw new Error("Failed to add document")
    }
  },
  updateDocument: (id, updatedDocument) => {
    updateDB((db) => {
      db.documents = db.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updatedDocument, updatedAt: new Date().toISOString() } : doc,
      )
      return db
    })
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updatedDocument, updatedAt: new Date().toISOString() } : doc,
      ),
    }))
  },
  removeDocument: (id) => {
    updateDB((db) => {
      db.documents = db.documents.filter((doc) => doc.id !== id)
      return db
    })
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    }))
  },
  addDocumentHistory: (documentId, changedBy, changes) => {
    updateDB((db) => {
      db.documents = db.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              history: [...doc.history, { changedBy, changedAt: new Date().toISOString(), changes }],
              updatedAt: new Date().toISOString(),
            }
          : doc,
      )
      return db
    })
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              history: [...doc.history, { changedBy, changedAt: new Date().toISOString(), changes }],
              updatedAt: new Date().toISOString(),
            }
          : doc,
      ),
    }))
  },
  reports: readDB().reports,
  addReport: (report) => {
    const newReport = { ...report, id: Date.now().toString() }
    updateDB((db) => {
      db.reports.push(newReport)
      return db
    })
    set((state) => ({ reports: [...state.reports, newReport] }))
  },
  updateReport: (id, updatedReport) => {
    updateDB((db) => {
      db.reports = db.reports.map((report) => (report.id === id ? { ...report, ...updatedReport } : report))
      return db
    })
    set((state) => ({
      reports: state.reports.map((report) => (report.id === id ? { ...report, ...updatedReport } : report)),
    }))
  },
  deleteReport: (id) => {
    updateDB((db) => {
      db.reports = db.reports.filter((report) => report.id !== id)
      return db
    })
    set((state) => ({
      reports: state.reports.filter((report) => report.id !== id),
    }))
  },
  bonuses: readDB().bonuses,
  addBonus: (bonus) => {
    const newBonus = { ...bonus, id: Date.now().toString(), isUsed: false }
    updateDB((db) => {
      db.bonuses.push(newBonus)
      return db
    })
    set((state) => ({ bonuses: [...state.bonuses, newBonus] }))
  },
  updateBonus: (id, updatedBonus) => {
    updateDB((db) => {
      db.bonuses = db.bonuses.map((bonus) => (bonus.id === id ? { ...bonus, ...updatedBonus } : bonus))
      return db
    })
    set((state) => ({
      bonuses: state.bonuses.map((bonus) => (bonus.id === id ? { ...bonus, ...updatedBonus } : bonus)),
    }))
  },
  deleteBonus: (id) => {
    updateDB((db) => {
      db.bonuses = db.bonuses.filter((bonus) => bonus.id !== id)
      return db
    })
    set((state) => ({
      bonuses: state.bonuses.filter((bonus) => bonus.id !== id),
    }))
  },
  markBonusAsUsed: (id, userId) => {
    updateDB((db) => {
      db.bonuses = db.bonuses.map((bonus) =>
        bonus.id === id ? { ...bonus, isUsed: true, usedBy: userId, usedAt: new Date().toISOString() } : bonus,
      )
      return db
    })
    set((state) => ({
      bonuses: state.bonuses.map((bonus) =>
        bonus.id === id ? { ...bonus, isUsed: true, usedBy: userId, usedAt: new Date().toISOString() } : bonus,
      ),
    }))
  },
  affiliates: readDB().affiliates,
  addAffiliate: (affiliate) => {
    const newAffiliate = { ...affiliate, id: Date.now().toString() }
    updateDB((db) => {
      db.affiliates.push(newAffiliate)
      return db
    })
    set((state) => ({ affiliates: [...state.affiliates, newAffiliate] }))
  },
  updateAffiliate: (id, updatedAffiliate) => {
    updateDB((db) => {
      db.affiliates = db.affiliates.map((affiliate) =>
        affiliate.id === id ? { ...affiliate, ...updatedAffiliate } : affiliate,
      )
      return db
    })
    set((state) => ({
      affiliates: state.affiliates.map((affiliate) =>
        affiliate.id === id ? { ...affiliate, ...updatedAffiliate } : affiliate,
      ),
    }))
  },
  deleteAffiliate: (id) => {
    updateDB((db) => {
      db.affiliates = db.affiliates.filter((affiliate) => affiliate.id !== id)
      return db
    })
    set((state) => ({
      affiliates: state.affiliates.filter((affiliate) => affiliate.id !== id),
    }))
  },
  fetchUsers: async () => {
    const response = await fetch("/api/users")
    const users = await response.json()
    set({ users })
  },
  fetchDocuments: async () => {
    const response = await fetch("/api/documents")
    const documents = await response.json()
    set({ documents })
  },
}))

