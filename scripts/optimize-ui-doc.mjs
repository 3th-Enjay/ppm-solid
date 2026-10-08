import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const uiDocPath = path.join(repoRoot, "ui.md")

if (!fs.existsSync(uiDocPath)) {
  console.error("ui.md not found in repository root.")
  process.exit(1)
}

const raw = fs.readFileSync(uiDocPath, "utf8")
const lines = raw.split(/\r?\n/)

const keepSections = []
let current = []
let keep = false

const shouldKeepHeading = (line) => {
  return (
    /^##\s+\d+\)\s+Progress Update \(Completed\)/.test(line) ||
    /^##\s+\d+\)\s+Dashboard Alignment Update \(Completed\)/.test(line) ||
    /^##\s+\d+\)\s+Multi-Role Implementation Update \(Completed\)/.test(line) ||
    /^##\s+\d+\)\s+Summary/.test(line)
  )
}

for (const line of lines) {
  if (line.startsWith("## ")) {
    if (keep && current.length > 0) keepSections.push(current.join("\n").trimEnd())
    current = [line]
    keep = shouldKeepHeading(line)
  } else if (current.length > 0) {
    current.push(line)
  }
}
if (keep && current.length > 0) keepSections.push(current.join("\n").trimEnd())

const header = [
  "# UI Implementation Log",
  "",
  "## Workflow Rule",
  "- Before any new stage work: run `npm run docs:optimize-ui`.",
  "- Then append new completed progress details.",
  "",
].join("\n")

const optimized = [header, ...keepSections].join("\n\n").trimEnd() + "\n"
fs.writeFileSync(uiDocPath, optimized, "utf8")

console.log("ui.md optimized successfully.")

