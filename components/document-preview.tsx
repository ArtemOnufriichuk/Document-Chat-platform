"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Maximize2, MessageSquare, FileDown } from "lucide-react"
import Link from "next/link"

interface DocumentPreviewProps {
  url: string
  onClose: () => void
  onChatNavigate: () => void
}

export default function DocumentPreview({ url, onClose, onChatNavigate }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleDownload = () => {
    window.open(`${url}&export=download`, "_blank")
  }

  return (
    <Card className={`w-full ${isFullscreen ? "h-screen" : "max-w-4xl"} mx-auto`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Предпросмотр документа</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onChatNavigate}>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <p>Загрузка документа...</p>
          </div>
        ) : (
          <iframe src={`${url}?embedded=true`} className="w-full h-[calc(100vh-200px)]" />
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onClose}>Закрыть</Button>
        <Link href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="ml-2">
            Открыть в Google Docs
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

