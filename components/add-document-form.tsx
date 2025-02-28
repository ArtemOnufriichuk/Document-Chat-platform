"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function AddDocumentForm() {
  const { addDocument, currentUser } = useAppStore()
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && url) {
      addDocument({
        title,
        url,
      })
      setTitle("")
      setUrl("")
    }
  }

  if (!currentUser?.isAdmin) {
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Добавить новый документ</CardTitle>
        <CardDescription>Введите данные нового Google Документа</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Название документа</Label>
              <Input
                id="title"
                placeholder="Введите название документа"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="url">URL документа</Label>
              <Input
                id="url"
                placeholder="Введите URL Google Документа"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>Добавить документ</Button>
      </CardFooter>
    </Card>
  )
}

