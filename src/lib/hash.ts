import { nanoid } from 'nanoid'

export function generateHash(): string {
  return nanoid(12)
}
