import { NextResponse } from "next/server"
import { readDB, updateDB } from "@/lib/db"
import type { Document } from "@/types"

export async function GET() {
  const db = readDB()
  return NextResponse.json(db.documents)
}

export async function POST(request: Request) {
  const newDocument: Omit<Document, "id" | "createdAt" | "updatedAt" | "history"> = await request.json()

  updateDB((db) => {
    const id = Date.now().toString()
    db.documents.push({
      ...newDocument,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
    })
    return db
  })

  return NextResponse.json({ message: "Document created successfully" }, { status: 201 })
}

