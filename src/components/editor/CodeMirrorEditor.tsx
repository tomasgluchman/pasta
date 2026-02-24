'use client'

import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { getLanguageExtension } from '@/lib/languages'

interface Props {
  content: string
  extension: string
  readOnly: boolean
  onChange?: (value: string) => void
  langOverride?: string
}

export default function CodeMirrorEditor({
  content,
  extension,
  readOnly,
  onChange,
  langOverride,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function init() {
      const ext = langOverride && langOverride !== 'auto' ? langOverride : extension
      const langExt = await getLanguageExtension(ext)

      if (destroyed) return

      const extensions = [
        oneDark,
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': { height: '100%', minHeight: '400px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: '14px' },
        }),
        EditorView.lineWrapping,
      ]

      if (langExt) extensions.push(langExt)
      if (!readOnly && highlightActiveLine) extensions.push(highlightActiveLine())

      if (!readOnly && onChange) {
        extensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          })
        )
      }

      const state = EditorState.create({ doc: content, extensions })
      const view = new EditorView({ state, parent: containerRef.current! })
      viewRef.current = view
    }

    // Destroy existing view before creating new one
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    init()

    return () => {
      destroyed = true
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extension, langOverride, readOnly])

  // Sync content changes when read-only (e.g. switching files)
  useEffect(() => {
    if (!viewRef.current || !readOnly) return
    const current = viewRef.current.state.doc.toString()
    if (current !== content) {
      viewRef.current.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      })
    }
  }, [content, readOnly])

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] overflow-hidden rounded-b border border-zinc-700"
    />
  )
}
