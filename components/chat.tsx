"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { ChatMessage, ChatStatus } from "@/types/chat"

interface ChatProps {
  documentIds: string[]
}

export default function Chat({ documentIds }: ChatProps) {
  const { documents } = useAppStore()
  const [input, setInput] = useState("")
  const [status, setStatus] = useState<ChatStatus>("connected")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const selectedDocuments = documents.filter((doc) => documentIds.includes(doc.id))

  useEffect(() => {
    // Initialize chat with a welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm ready to help you with information from the selected documents. What would you like to know?",
        timestamp: Date.now(),
        status: "sent",
      },
    ])
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== "connected") return

    const messageId = Date.now().toString()
    const userMessage = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: Date.now(),
      status: "sending",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      // Here you would typically send the message to your backend
      // For now, we'll just simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const response =
        "This is a simulated response. In a real application, this would be the response from your AI model based on the selected documents."

      setMessages((prev) => [
        ...prev,
        { ...userMessage, status: "sent" },
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response,
          timestamp: Date.now(),
          status: "sent",
        },
      ])
    } catch (error) {
      console.error("Error in chat:", error)
      setStatus("error")

      setMessages((prev) => [
        ...prev,
        { ...userMessage, status: "error" },
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "An error occurred while processing your message.",
          timestamp: Date.now(),
          status: "error",
        },
      ])

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [])

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)]">
      <CardHeader>
        <CardTitle>Chat with Documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow overflow-hidden">
        <div className="w-64 border-r pr-4">
          <h3 className="font-semibold mb-2">Selected Documents:</h3>
          <ul className="space-y-2">
            {selectedDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                <span className="truncate">{doc.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-grow pl-4 flex flex-col">
          <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
            <div className="flex flex-col gap-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={cn(
                      "flex flex-col gap-1 rounded-md px-3 py-2 text-sm w-fit max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs text-muted-foreground flex justify-end items-center">
                      {message.status === "sending" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {message.status === "sent" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {message.status === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={status !== "connected"}
              className="flex-grow"
            />
            <Button type="submit" disabled={status !== "connected"}>
              {status === "connected" ? (
                <Send className="h-4 w-4 mr-2" />
              ) : (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

