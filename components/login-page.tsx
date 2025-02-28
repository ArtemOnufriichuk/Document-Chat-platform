"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const { login, currentUser, users } = useAppStore()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    console.log("Attempting login with:", username, password)
    console.log("Available users:", users)
    const success = login(username, password)
    console.log("Login success:", success)
    console.log("Current user after login attempt:", currentUser)
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Неверное имя пользователя или пароль")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>Введите свои учетные данные для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  placeholder="Введите имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <Button className="w-full mt-4" type="submit">
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

