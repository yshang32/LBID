import { spawnSync } from "node:child_process"

const env = { ...process.env }

for (const key of Object.keys(env)) {
  const isVercelInternal =
    key === "VERCEL" ||
    key.startsWith("VERCEL_") ||
    key.startsWith("NOW_") ||
    key.startsWith("NEXT_PRIVATE_") ||
    key.startsWith("NEXT_EDGE_") ||
    key.startsWith("NEXT_ENABLE_") ||
    key.startsWith("NEXT_PUBLIC_VERCEL_")

  if (isVercelInternal) delete env[key]
}

const result = spawnSync(process.execPath, ["--trace-exit", "--trace-uncaught", "--trace-warnings", "node_modules/next/dist/bin/next", "build"], {
  env,
  stdio: "inherit",
})

if (result.status !== 0) {
  console.error(`[lbid-build] next build failed status=${result.status ?? "null"} signal=${result.signal ?? "null"}`)
  if (result.error) console.error(`[lbid-build] spawn error: ${result.error.message}`)
}

process.exit(result.status ?? 1)
