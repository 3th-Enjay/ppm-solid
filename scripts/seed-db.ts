import { runCatalogSeed } from "./seed-technology-catalog"

const args = process.argv.slice(2)
const isExecute = args.includes("--execute")
const isDryRun = !isExecute || args.includes("--dry-run")

runCatalogSeed({ dryRun: isDryRun })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed execution failed:", err)
    process.exit(1)
  })
