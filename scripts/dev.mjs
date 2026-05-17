import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))

function run(cmd, args) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: path.resolve(dir, '..') })
  const kill = () => child.kill()
  process.on('SIGINT', kill)
  process.on('SIGTERM', kill)
  child.on('exit', (code) => process.exit(code ?? 0))
  return child
}

run('node', ['scripts/build-tracker.mjs', '--watch'])
run('node_modules/.bin/vite', [])
