import { cpSync, mkdirSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const output = join(root, ".vercel", "output")
const staticDir = join(output, "static")

rmSync(output, { force: true, recursive: true })
mkdirSync(staticDir, { recursive: true })

cpSync(join(root, "index.html"), join(staticDir, "index.html"))
cpSync(join(root, "public"), staticDir, { recursive: true })

const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
}

mkdirSync(output, { recursive: true })
await import("node:fs/promises").then(({ writeFile }) =>
  writeFile(join(output, "config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8"),
)
