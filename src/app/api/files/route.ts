import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { writeFile } from '@/lib/files'
import { generateHash } from '@/lib/hash'
import { getServerAuthStatus } from '@/lib/auth'
import type { FileMeta } from '@/types'

const MAX_FILE_SIZE = 1024 * 1024 // 1 MB

export async function GET() {
  if (!(await getServerAuthStatus())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = await getDb()
  const result = await db.execute(
    'SELECT * FROM files ORDER BY created_at DESC'
  )
  const files = result.rows as unknown as FileMeta[]
  return NextResponse.json(files)
}

export async function POST(req: NextRequest) {
  if (!(await getServerAuthStatus())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''
  let filename: string
  let content: string
  let extension: string

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const nameField = formData.get('filename') as string | null
    const contentField = formData.get('content') as string | null

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File exceeds 1 MB limit' }, { status: 413 })
      }
      filename = file.name
      content = await file.text()
    } else if (nameField && contentField !== null) {
      if (contentField.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Content exceeds 1 MB limit' }, { status: 413 })
      }
      filename = nameField
      content = contentField
    } else {
      return NextResponse.json({ error: 'Missing file or filename+content' }, { status: 400 })
    }
  } else {
    const body = await req.json()
    filename = body.filename
    content = body.content ?? ''
    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
    }
    if (content.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Content exceeds 1 MB limit' }, { status: 413 })
    }
  }

  const parts = filename.split('.')
  extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'txt'
  if (!extension) extension = 'txt'

  const hash = generateHash()
  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO files (hash, filename, extension) VALUES (?, ?, ?)',
    args: [hash, filename, extension],
  })

  try {
    await writeFile(hash, extension, content)
  } catch (err) {
    await db.execute({ sql: 'DELETE FROM files WHERE hash = ?', args: [hash] })
    throw err
  }

  return NextResponse.json({ hash, filename, extension }, { status: 201 })
}
