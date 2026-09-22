/** Offline acceptance renderer. Supply an explicitly authorized Public/Paper DTO;
 * this script never loads credentials, queries a DB, or generates factual data. */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { PaperMapSource } from '../../shared/types/paper-map'
import { paperDesignCatalog, paperDesignConfig, type PaperDesignId } from '../../shared/utils/paper-map-designs'
import { createEditorialRenderer, generateEditorialPdf } from '../../server/utils/paper-map-editorial-renderer'

const args = new Map(process.argv.slice(2).reduce<Array<[string, string]>>((pairs, value, index, all) => {
  if (index % 2 === 0) pairs.push([value, all[index + 1] ?? ''])
  return pairs
}, []))
const sourcePath = args.get('--source'), uploads = args.get('--uploads'), output = args.get('--output'), design = args.get('--design'), kind = args.get('--kind'), baseUrl = args.get('--base-url')
if (!sourcePath || !uploads || !output || !baseUrl || !paperDesignCatalog.some(d => d.id === design) || !['REAL QA SOURCE', 'SYNTHETIC FIXTURE'].includes(kind ?? '')) {
  throw new Error('Required: --source PaperMapSource.json --uploads directory --output directory --design catalog-id --kind "REAL QA SOURCE|SYNTHETIC FIXTURE" --base-url authorized-public-url')
}
const input = await readFile(sourcePath), source = JSON.parse(input.toString()) as PaperMapSource
const config = paperDesignConfig(design as PaperDesignId, source)
const options = { publicBaseUrl: baseUrl, uploadDirectory: resolve(uploads), storage: { put: async () => undefined, get: async () => null } }
const renderer = createEditorialRenderer(source, config, options), outputPath = resolve(output)
await mkdir(outputPath, { recursive: true })
const started = performance.now(), pdf = await generateEditorialPdf(source, config, options), pdfMs = performance.now() - started
await writeFile(resolve(outputPath, 'paper.pdf'), pdf)
for (let page = 0; page < renderer.document.pages.length; page++) await writeFile(resolve(outputPath, `preview-${page + 1}.png`), await renderer.render(page, 150))
await writeFile(resolve(outputPath, 'metadata.json'), JSON.stringify({ kind, sourceSha256: createHash('sha256').update(input).digest('hex'), config, pages: renderer.document.pages.length, pdfBytes: pdf.length, pdfMs: Math.round(pdfMs), warnings: [...renderer.warnings] }, null, 2))
console.log(JSON.stringify({ output: outputPath, pages: renderer.document.pages.length, pdfBytes: pdf.length, pdfMs: Math.round(pdfMs) }))
