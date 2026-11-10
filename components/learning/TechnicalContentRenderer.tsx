"use client"

import React, { useState } from "react"
import { Check, Copy, Terminal, Code2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TechnicalContentRendererProps {
  content: string
  className?: string
}

interface ParsedBlock {
  type: "code" | "heading" | "list" | "quote" | "paragraph"
  level?: number
  language?: string
  content: string
  items?: string[]
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  if (!text) return []

  const lines = text.split("\n")
  const blocks: ParsedBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim() || "plaintext"
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      blocks.push({
        type: "code",
        language,
        content: codeLines.join("\n"),
      })
      continue
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      })
      i++
      continue
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [line.trim().replace(/^>\s?/, "")]
      i++
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""))
        i++
      }
      blocks.push({
        type: "quote",
        content: quoteLines.join(" "),
      })
      continue
    }

    // Lists (unordered - or * or numbered 1.)
    if (/^\s*([*-]|\d+\.)\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*([*-]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([*-]|\d+\.)\s+/, "").trim())
        i++
      }
      blocks.push({
        type: "list",
        content: "",
        items,
      })
      continue
    }

    // Empty lines
    if (!line.trim()) {
      i++
      continue
    }

    // Paragraph
    const paraLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^(#{1,4})\s+/) &&
      !lines[i].trim().startsWith(">") &&
      !/^\s*([*-]|\d+\.)\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push({
      type: "paragraph",
      content: paraLines.join(" "),
    })
  }

  return blocks
}

function InlineTextRenderer({ text }: { text: string }) {
  // Parse inline elements: `code`, **bold**, *italic*, [link](url)
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    // Check for inline code `...`
    const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/)
    if (codeMatch) {
      if (codeMatch[1]) {
        parts.push(<span key={`text-${keyIndex++}`}>{codeMatch[1]}</span>)
      }
      parts.push(
        <code
          key={`code-${keyIndex++}`}
          className="rounded-md bg-secondary/80 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary"
        >
          {codeMatch[2]}
        </code>,
      )
      remaining = codeMatch[3]
      continue
    }

    // Check for bold **...**
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*([^*]+)\*\*([\s\S]*)$/)
    if (boldMatch) {
      if (boldMatch[1]) {
        parts.push(<span key={`text-${keyIndex++}`}>{boldMatch[1]}</span>)
      }
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-foreground">
          {boldMatch[2]}
        </strong>,
      )
      remaining = boldMatch[3]
      continue
    }

    // Plain remaining text
    parts.push(<span key={`rest-${keyIndex++}`}>{remaining}</span>)
    break
  }

  return <>{parts}</>
}

function CodeSnippet({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950 font-mono text-xs shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {language}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px] font-sans">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Body */}
      <div className="overflow-x-auto p-4 text-slate-200">
        <pre className="whitespace-pre leading-relaxed font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export function TechnicalContentRenderer({
  content,
  className = "",
}: TechnicalContentRendererProps) {
  const blocks = parseMarkdownBlocks(content)

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
        No written reading material provided for this lesson.
      </div>
    )
  }

  return (
    <div className={`space-y-4 text-sm leading-7 text-foreground/90 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            if (block.level === 1) {
              return (
                <h2
                  key={idx}
                  className="mt-6 mb-2 border-b border-border/60 pb-2 text-xl font-bold tracking-tight text-foreground"
                >
                  <InlineTextRenderer text={block.content} />
                </h2>
              )
            }
            if (block.level === 2) {
              return (
                <h3 key={idx} className="mt-5 mb-2 text-lg font-bold text-foreground">
                  <InlineTextRenderer text={block.content} />
                </h3>
              )
            }
            return (
              <h4 key={idx} className="mt-4 mb-1 text-base font-semibold text-foreground">
                <InlineTextRenderer text={block.content} />
              </h4>
            )
          }

          case "code":
            return (
              <CodeSnippet
                key={idx}
                code={block.content}
                language={block.language || "code"}
              />
            )

          case "quote":
            return (
              <div
                key={idx}
                className="my-3 flex items-start gap-3 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-foreground/90"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-sm italic">
                  <InlineTextRenderer text={block.content} />
                </div>
              </div>
            )

          case "list":
            return (
              <ul key={idx} className="my-2 space-y-1.5 pl-5 list-disc text-muted-foreground">
                {(block.items || []).map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    <InlineTextRenderer text={item} />
                  </li>
                ))}
              </ul>
            )

          case "paragraph":
          default:
            return (
              <p key={idx} className="leading-relaxed text-muted-foreground">
                <InlineTextRenderer text={block.content} />
              </p>
            )
        }
      })}
    </div>
  )
}
