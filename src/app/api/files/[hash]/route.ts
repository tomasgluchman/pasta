import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { readFile, writeFile, deleteFile, renameFile } from '@/lib/files'
import { getServerAuthStatus } from '@/lib/auth'
import type { FileMeta } from '@/types'

const MAX_FILE_SIZE = 1024 * 1024 // 1 MB

type RouteContext = { params: Promise<{ hash: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { hash } = await params
  const db = await getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM files WHERE hash = ?',
    args: [hash],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const meta = result.rows[0] as unknown as FileMeta
  const content = await readFile(meta.hash, meta.extension)
  return NextResponse.json({ ...meta, content })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  if (!(await getServerAuthStatus())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { hash } = await params
  const db = await getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM files WHERE hash = ?',
    args: [hash],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const meta = result.rows[0] as unknown as FileMeta
  const { filename, content } = await req.json()

  if (filename !== undefined && !filename) {
    return NextResponse.json({ error: 'Filename cannot be empty' }, { status: 400 })
  }

  if (content !== undefined && content.length > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Content exceeds 1 MB limit' }, { status: 413 })
  }

  let newExtension = meta.extension
  if (filename) {
    const parts = (filename as string).split('.')
    newExtension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : meta.extension
  }

  // Rename before writing so new content isn't overwritten by the rename
  if (newExtension !== meta.extension) {
    await renameFile(hash, meta.extension, newExtension)
  }

  if (content !== undefined) {
    await writeFile(hash, newExtension, content)
  }

  await db.execute({
    sql: `UPDATE files SET filename = ?, extension = ?, updated_at = datetime('now') WHERE hash = ?`,
    args: [filename || meta.filename, newExtension, hash],
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!(await getServerAuthStatus())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { hash } = await params
  const db = await getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM files WHERE hash = ?',
    args: [hash],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const meta = result.rows[0] as unknown as FileMeta
  await deleteFile(hash, meta.extension)
  await db.execute({
    sql: 'DELETE FROM files WHERE hash = ?',
    args: [hash],
  })

  return NextResponse.json({ ok: true })
}
