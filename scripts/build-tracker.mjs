import { build } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const config = path.resolve(dir, '../vite.tracker.config.ts')
const watch = process.argv.includes('--watch')

await build({
  configFile: config,
  watch: watch ? {} : undefined,
})

if (!watch) process.exit(0)
