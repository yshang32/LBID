import { spawnSync } from "node:child_process"

const env = { ...process.env }
delete env.VERCEL

const debugEnvNames = Object.keys(process.env)
  .filter((key) => /^(CI|NODE_ENV|NEXT|NOW|VERCEL)/.test(key))
  .sort()
console.error(`[lbid-build] env flags: ${debugEnvNames.join(", ")}`)

const result = spawnSync(process.execPath, ["--trace-uncaught", "--trace-warnings", "node_modules/next/dist/bin/next", "build"], {
  env,
  stdio: "inherit",
})

if (result.status !== 0) {
  console.error(`[lbid-build] next build failed status=${result.status ?? "null"} signal=${result.signal ?? "null"}`)
  if (result.error) console.error(`[lbid-build] spawn error: ${result.error.message}`)
}

process.exit(result.status ?? 1)
