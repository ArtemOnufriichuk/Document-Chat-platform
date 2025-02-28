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

