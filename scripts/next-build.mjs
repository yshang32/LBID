import { spawnSync } from "node:child_process"

const env = { ...process.env }
delete env.VERCEL

const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  env,
  stdio: "inherit",
})

process.exit(result.status ?? 1)
