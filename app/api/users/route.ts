import { NextResponse } from "next/server"
import { readDB, updateDB } from "@/lib/db"
import type { User } from "@/types"

export async function GET() {
  const db = readDB()
  return NextResponse.json(db.users)
}

export async function POST(request: Request) {
  const newUser: Omit<User, "id"> = await request.json()

  updateDB((db) => {
    const id = Date.now().toString()
    db.users.push({ ...newUser, id, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() })
    return db
  })

  return NextResponse.json({ message: "User created successfully" }, { status: 201 })
}

