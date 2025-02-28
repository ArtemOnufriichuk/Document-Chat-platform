export interface User {
  id: string
  login: string
  password: string
  isAdmin: boolean
  email: string
  fullName: string
  createdAt: string
  lastLogin: string
}

export interface Document {
  id: string
  title: string
  url: string
  createdAt: string
  updatedAt: string
  history: DocumentHistory[]
  chatHistory?: ChatMessage[]
}

export interface DocumentHistory {
  changedBy: string
  changedAt: string
  changes: string
}

export interface Bonus {
  id: string
  name: string
  description: string
  amount: number
  isUsed: boolean
  usedBy?: string
  usedAt?: string
}

export interface Affiliate {
  id: string
  name: string
  code: string
  commission: number
}

export interface Report {
  id: string
  title: string
  url: string
  date: string
}

export interface DB {
  users: User[]
  documents: Document[]
  bonuses: Bonus[]
  affiliates: Affiliate[]
  reports: Report[]
}

export type ChatStatus = "connecting" | "connected" | "disconnected" | "error"
export type MessageStatus = "sending" | "sent" | "error"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  status?: MessageStatus
  timestamp: number
}

export interface ChatState {
  status: ChatStatus
  messages: ChatMessage[]
  error?: string
}

