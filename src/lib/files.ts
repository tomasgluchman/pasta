import fs from 'fs/promises'
import path from 'path'

const FILES_DIR = path.join(process.env.APP_DIR ?? process.cwd(), 'files')

async function ensureFilesDir(): Promise<void> {
  await fs.mkdir(FILES_DIR, { recursive: true })
}

export function getFilePath(hash: string, extension: string): string {
  return path.join(FILES_DIR, `${hash}.${extension}`)
}

export async function writeFile(hash: string, extension: string, content: string): Promise<void> {
  await ensureFilesDir()
  await fs.writeFile(getFilePath(hash, extension), content, 'utf8')
}

export async function readFile(hash: string, extension: string): Promise<string> {
  return fs.readFile(getFilePath(hash, extension), 'utf8')
}

export async function deleteFile(hash: string, extension: string): Promise<void> {
  try {
    await fs.unlink(getFilePath(hash, extension))
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}

export async function renameFile(
  hash: string,
  oldExtension: string,
  newExtension: string
): Promise<void> {
  if (oldExtension === newExtension) return
  const oldPath = getFilePath(hash, oldExtension)
  const newPath = getFilePath(hash, newExtension)
  await fs.rename(oldPath, newPath)
}
