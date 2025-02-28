"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    } else {
      const tab = searchParams.get("tab") || "documents"
      setActiveTab(tab)
    }
  }, [currentUser, router, searchParams])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard?tab=${value}`)
  }

  if (!currentUser || activeTab === null) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Панель управления</h1>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button onClick={handleLogout}>Выйти</Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="chat">Чат</TabsTrigger>
          <TabsTrigger value="bonuses">Бонусы</TabsTrigger>
          <TabsTrigger value="affiliates">Аффилиаты</TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
          {currentUser.isAdmin && <TabsTrigger value="users">Пользователи</TabsTrigger>}
        </TabsList>
        <TabsContent value={activeTab}>{children}</TabsContent>
      </Tabs>
    </div>
  )
}

