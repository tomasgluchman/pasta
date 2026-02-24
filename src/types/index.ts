export interface FileMeta {
  id: number
  hash: string
  filename: string
  extension: string
  created_at: string
  updated_at: string
}

export interface FileWithContent extends FileMeta {
  content: string
}
