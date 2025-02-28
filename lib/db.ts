import fs from "fs"
import path from "path"
import type { DB } from "@/types"

const DB_PATH = path.join(process.cwd(), "database.json")

export function readDB(): DB {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("Database file not found")
  }
  const data = fs.readFileSync(DB_PATH, "utf-8")
  return JSON.parse(data)
}

export function writeDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function updateDB(updater: (db: DB) => DB): void {
  const db = readDB()
  const updatedDB = updater(db)
  writeDB(updatedDB)
}

