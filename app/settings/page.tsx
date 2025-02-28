"use client"

import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import UserManagement from "@/components/user-management"

export default function SettingsPage() {
  const { currentUser, users, documents } = useAppStore()
  const router = useRouter()

  if (!currentUser?.isAdmin) {
    router.push("/")
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Всего пользователей: {users.length}</p>
          <p>Всего документов: {documents.length}</p>
        </CardContent>
      </Card>
      <UserManagement />
    </div>
  )
}

