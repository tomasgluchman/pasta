'use client'

import { SUPPORTED_LANGUAGES } from '@/lib/languages'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function LanguageSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 text-sm focus:outline-none focus:border-zinc-500"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}
