"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileEdit, Trash2, Eye, ExternalLink, Plus } from 'lucide-react'
import DocumentPreview from "./document-preview"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function Reports() {
  const { reports = [], addReport, updateReport, deleteReport, currentUser } = useAppStore()
  const [newReport, setNewReport] = useState({ title: "", url: "", date: "" })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<Report | null>(null)

  const handleAddReport = () => {
    if (newReport.title && newReport.url && newReport.date) {
      addReport(newReport)
      setNewReport({ title: "", url: "", date: "" })
    }
  }

  const handleUpdateReport = () => {
    if (editingReport) {
      updateReport(editingReport.id, editingReport)
      setEditingReport(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {currentUser?.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Добавить новый отчет</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Название"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  value={newReport.url}
                  onChange={(e) => setNewReport({ ...newReport, url: e.target.value })}
                />
                <Input
                  type="date"
                  value={newReport.date}
                  onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddReport}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить отчет
              </Button>
            </CardFooter>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.length > 0 ? (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>Дата: {report.date}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate" title={report.url}>
                    URL: {report.url}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setPreviewUrl(report.url)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Предпросмотр
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(report.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Открыть
                  </Button>
                  {currentUser?.isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditingReport(report)}>
                        <FileEdit className="w-4 h-4 mr-2" />
                        Редактировать
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteReport(report.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <p>Нет доступных отчетов.</p>
          )}
        </div>
        {previewUrl && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center p-4">
            <DocumentPreview url={previewUrl} onClose={() => setPreviewUrl(null)} onChatNavigate={() => {}} />
          </div>
        )}
      </div>
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать отчет</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Название
              </Label>
              <Input
                id="title"
                value={editingReport?.title || ""}
                onChange={(e) => setEditingReport((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={editingReport?.url || ""}
                onChange={(e) => setEditingReport((prev) => (prev ? { ...prev, url: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Дата
              </Label>
              <Input
                id="date"
                type="date"
                value={editingReport?.date || ""}
                onChange={(e) => setEditingReport((prev) => (prev ? { ...prev, date: e.target.value } : null))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateReport}>Сохранить изменения</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

