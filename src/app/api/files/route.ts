import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { writeFile } from '@/lib/files'
import { generateHash } from '@/lib/hash'
import type { FileMeta } from '@/types'

export async function GET() {
  const db = await getDb()
  const result = await db.execute(
    'SELECT * FROM files ORDER BY created_at DESC'
  )
  const files = result.rows as unknown as FileMeta[]
  return NextResponse.json(files)
}

export async function POST(req: NextRequest) {
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
      filename = file.name
      content = await file.text()
    } else if (nameField && contentField !== null) {
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
  }

  const parts = filename.split('.')
  extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'txt'
  if (!extension) extension = 'txt'

  const hash = generateHash()
  await writeFile(hash, extension, content)

  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO files (hash, filename, extension) VALUES (?, ?, ?)',
    args: [hash, filename, extension],
  })

  return NextResponse.json({ hash, filename, extension }, { status: 201 })
}
