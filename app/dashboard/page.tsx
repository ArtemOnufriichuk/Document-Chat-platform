"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/lib/store"
import DocumentList from "@/components/document-list"
import Search from "@/components/search"
import AddDocumentForm from "@/components/add-document-form"
import Chat from "@/components/chat"
import Bonuses from "@/components/bonuses"
import Affiliates from "@/components/affiliates"
import Reports from "@/components/reports"
import UserManagement from "@/components/user-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, documents, fetchUsers, fetchDocuments } = useAppStore()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    } else {
      const tab = searchParams.get("tab") || "documents"
      setActiveTab(tab)
    }
  }, [currentUser, router, searchParams])

  useEffect(() => {
    fetchUsers()
    fetchDocuments()
  }, [fetchUsers, fetchDocuments])

  if (!currentUser || activeTab === null) {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case "documents":
        return (
          <>
            <Search />
            <AddDocumentForm />
            <DocumentList />
          </>
        )
      case "chat":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader>
                <CardTitle>Выбранные документы</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                      {selectedDocuments.length > 0 ? `${selectedDocuments.length} выбрано` : "Выберите документы"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Поиск документа..." />
                      <CommandList>
                        <CommandEmpty>Документы не найдены.</CommandEmpty>
                        <CommandGroup>
                          {documents && documents.length > 0 ? (
                            documents.map((doc) => (
                              <CommandItem
                                key={doc.id}
                                onSelect={() => {
                                  setSelectedDocuments((prev) =>
                                    prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id],
                                  )
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedDocuments.includes(doc.id) ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {doc.title}
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>Нет доступных документов</CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-4">
              {selectedDocuments.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map((docId) => {
                      const doc = documents?.find((d) => d.id === docId)
                      return doc ? (
                        <Badge key={docId} variant="secondary" className="flex items-center gap-1">
                          {doc.title}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => setSelectedDocuments(selectedDocuments.filter((id) => id !== docId))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                  <Chat documentIds={selectedDocuments} />
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                    <p className="text-muted-foreground">Выберите документы слева, чтобы начать чат</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Вы можете выбрать несколько документов для более широкого контекста
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
      case "bonuses":
        return <Bonuses />
      case "affiliates":
        return <Affiliates />
      case "reports":
        return <Reports />
      case "users":
        return <UserManagement />
      default:
        return null
    }
  }

  return <div className="w-full">{renderContent()}</div>
}

