"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileEdit, Trash2, Eye, ExternalLink, MessageSquare, CheckCircle2 } from "lucide-react"
import DocumentPreview from "./document-preview"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Chat from "./chat"
import type { Document } from "@/types"

export default function DocumentList() {
  const router = useRouter()
  const { documents = [], removeDocument, currentUser, searchTerm, addDocumentHistory, updateDocument } = useAppStore()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deletedDocuments, setDeletedDocuments] = useState<string[]>([])
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showChat, setShowChat] = useState(false)

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      doc.url.toLowerCase().includes((searchTerm || "").toLowerCase()),
  )

  useEffect(() => {
    setDeletedDocuments([])
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      setDeletedDocuments((prev) => [...prev, id])
      removeDocument(id)
    },
    [removeDocument],
  )

  const handleEdit = useCallback((document: Document) => {
    setEditingDocument(document)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingDocument && currentUser) {
      const changes = `Отредактирован документ "${editingDocument.title}"`
      addDocumentHistory(editingDocument.id, currentUser.id, changes)
      updateDocument(editingDocument.id, {
        title: editingDocument.title,
        url: editingDocument.url,
      })
      setEditingDocument(null)
    }
  }, [editingDocument, currentUser, addDocumentHistory, updateDocument])

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments((prev) => (prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]))
  }

  if (documents.length === 0) {
    return <p>No documents found.</p>
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documents</h2>
        <Button onClick={() => setShowChat(true)} disabled={selectedDocuments.length === 0}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat with Selected Documents
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{doc.title}</span>
                <Button variant="ghost" size="sm" onClick={() => toggleDocumentSelection(doc.id)}>
                  {selectedDocuments.includes(doc.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>ID: {doc.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground truncate" title={doc.url}>
                URL: {doc.url}
              </p>
              <p className="text-sm text-muted-foreground">Created: {new Date(doc.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">Updated: {new Date(doc.updatedAt).toLocaleDateString()}</p>
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="history">
                  <AccordionTrigger>Change History</AccordionTrigger>
                  <AccordionContent>
                    {doc.history && doc.history.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {doc.history.map((entry, index) => (
                          <li key={index} className="text-sm">
                            {entry.changes} - {new Date(entry.changedAt).toLocaleString()} ({entry.changedBy})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No change history</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setPreviewUrl(doc.url)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(doc.url, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
              {currentUser?.isAdmin && !deletedDocuments.includes(doc.id) && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(doc)}>
                    <FileEdit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {previewUrl && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center p-4">
          <DocumentPreview url={previewUrl} onClose={() => setPreviewUrl(null)} onChatNavigate={() => {}} />
        </div>
      )}

      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editingDocument?.title || ""}
                onChange={(e) => setEditingDocument((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={editingDocument?.url || ""}
                onChange={(e) => setEditingDocument((prev) => (prev ? { ...prev, url: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chat with Selected Documents</DialogTitle>
          </DialogHeader>
          <Chat documentIds={selectedDocuments} />
        </DialogContent>
      </Dialog>
    </>
  )
}

