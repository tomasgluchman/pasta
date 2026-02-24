import { createClient, type Client } from '@libsql/client'
import fs from 'fs/promises'
import path from 'path'

let client: Client | null = null
let initialized = false

export async function getDb(): Promise<Client> {
  if (!client) {
    const dataDir = path.join(process.cwd(), 'data')
    await fs.mkdir(dataDir, { recursive: true })
    const dbPath = path.join(dataDir, 'pasta.db')
    client = createClient({ url: `file:${dbPath}` })
  }

  if (!initialized) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        hash        TEXT    NOT NULL UNIQUE,
        filename    TEXT    NOT NULL,
        extension   TEXT    NOT NULL,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `)
    initialized = true
  }

  return client
}
