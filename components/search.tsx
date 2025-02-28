"use client"

import type React from "react"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

export default function Search() {
  const { searchDocuments } = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchDocuments(searchTerm)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
      <Input
        type="text"
        placeholder="Поиск документов..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit">
        <SearchIcon className="w-4 h-4 mr-2" />
        Поиск
      </Button>
    </form>
  )
}

