// Converts the generated journey keyframes into optimized WebP pairs used by
// the auth cinematic canvas. Source PNGs are read from the folder passed as
// argv[2]; outputs land in public/journey/.
import { mkdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const sourceDir = process.argv[2]
if (!sourceDir) {
  console.error("Usage: node scripts/build-journey-frames.mjs <dir-with-scene-N.png>")
  process.exit(1)
}

const outDir = path.join(process.cwd(), "public", "journey")
await mkdir(outDir, { recursive: true })

for (let i = 1; i <= 5; i++) {
  const src = path.join(sourceDir, `scene-${i}.png`)
  const large = path.join(outDir, `scene-${i}.webp`)
  const small = path.join(outDir, `scene-${i}-sm.webp`)
  await sharp(src).resize({ width: 1920 }).webp({ quality: 78 }).toFile(large)
  await sharp(src).resize({ width: 900 }).webp({ quality: 72 }).toFile(small)
  console.log(`scene-${i}: ok`)
}
console.log("Journey frames written to public/journey")
