import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { ARIMATSU_SPOTS } from './arimatsu-baseline-lib'

const output = resolve('docs/qa/wu58-paper-map-template-studio/targets')
const mapPath = resolve('prisma/seed-assets/arimatsu-demo/arimatsu-map.png')
const palette = { paper: '#fffdf8', ink: '#28231f', accent: '#9b4d2d', soft: '#eee3d3', muted: '#706860', green: '#315b49' }
const escapeXml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
const lines = ARIMATSU_SPOTS.slice(0, 12).map((spot, index) => ({ number: index + 1, name: spot.name, category: spot.category, description: spot.description }))

async function save(name: string, width: number, height: number, svg: string, map: Buffer) {
  const png = await sharp(Buffer.from(svg)).composite([{ input: map, left: Math.round(width * .055), top: Math.round(height * .17) }]).png().toBuffer()
  const pngPath = resolve(output, `${name}.png`), pdfPath = resolve(output, `${name}.pdf`)
  await writeFile(pngPath, png)
  const document = await PDFDocument.create(), page = document.addPage([width * .48, height * .48]), image = await document.embedPng(png)
  page.drawImage(image, { x: 0, y: 0, width: width * .48, height: height * .48 }); document.setTitle(`有松マップ — ${name}`); document.setCreator('Digital Map WU-58 target')
  await writeFile(pdfPath, await document.save())
}

function shell(width: number, height: number, title: string, body: string) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${palette.paper}"/><style>text{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style><text x="${width * .055}" y="${height * .075}" font-size="${width * .035}" font-weight="700" fill="${palette.ink}">${title}</text><text x="${width * .055}" y="${height * .115}" font-size="${width * .015}" fill="${palette.muted}">有松・桶狭間　｜　既存マップ情報から作成</text>${body}<text x="${width * .055}" y="${height * .965}" font-size="${width * .012}" fill="${palette.muted}">Digital Map  ·  source-only target</text></svg>`
}

async function main() {
  await mkdir(output, { recursive: true })
  const map = await sharp(await readFile(mapPath)).resize(850, 640, { fit: 'contain', background: palette.soft }).png().toBuffer()
  const classicList = lines.slice(0, 10).map((spot, index) => `<circle cx="1000" cy="${230 + index * 54}" r="17" fill="${palette.green}"/><text x="1000" y="${236 + index * 54}" font-size="16" text-anchor="middle" font-weight="700" fill="#fff">${spot.number}</text><text x="1030" y="${236 + index * 54}" font-size="21" font-weight="700" fill="${palette.ink}">${escapeXml(spot.name)}</text>`).join('')
  await save('map-classic', 1440, 1018, shell(1440, 1018, '有松マップ', `<rect x="79" y="173" width="850" height="640" fill="none" stroke="${palette.accent}" stroke-width="4"/><text x="980" y="185" font-size="25" font-weight="700" fill="${palette.accent}">まち歩きスポット</text>${classicList}<text x="980" y="825" font-size="16" fill="${palette.muted}">歴史・文化  ·  有松絞り  ·  寺社  ·  交通</text>`), map)
  const guideCards = lines.slice(0, 8).map((spot, index) => { const x = 80 + (index % 2) * 620, y = 1020 + Math.floor(index / 2) * 120; return `<rect x="${x}" y="${y}" width="575" height="95" rx="8" fill="#fff" stroke="${palette.soft}"/><text x="${x + 22}" y="${y + 32}" font-size="20" font-weight="700" fill="${palette.accent}">${spot.number}. ${escapeXml(spot.name)}</text><text x="${x + 22}" y="${y + 62}" font-size="15" fill="${palette.muted}">${escapeXml(spot.description.slice(0, 38))}</text><text x="${x + 22}" y="${y + 84}" font-size="12" fill="${palette.green}">${escapeXml(spot.category)}</text>` }).join('')
  const portraitMap = await sharp(await readFile(mapPath)).resize(850, 640, { fit: 'contain', background: palette.soft }).png().toBuffer()
  await save('spot-guide', 1320, 1868, shell(1320, 1868, '有松まち歩きガイド', `<rect x="72" y="318" width="850" height="640" fill="none" stroke="${palette.accent}" stroke-width="4"/><text x="80" y="995" font-size="25" font-weight="700" fill="${palette.accent}">スポットガイド</text>${guideCards}`), portraitMap)
  const storyCards = lines.slice(0, 6).map((spot, index) => { const x = 80 + (index % 2) * 620, y = 1020 + Math.floor(index / 2) * 190; return `<rect x="${x}" y="${y}" width="575" height="160" rx="10" fill="#fff" stroke="${palette.soft}"/><circle cx="${x + 48}" cy="${y + 50}" r="25" fill="${palette.green}"/><text x="${x + 48}" y="${y + 58}" font-size="21" text-anchor="middle" font-weight="700" fill="#fff">${spot.number}</text><text x="${x + 88}" y="${y + 48}" font-size="21" font-weight="700" fill="${palette.ink}">${escapeXml(spot.name)}</text><text x="${x + 88}" y="${y + 78}" font-size="14" fill="${palette.green}">${escapeXml(spot.category)}</text><text x="${x + 24}" y="${y + 115}" font-size="15" fill="${palette.muted}">${escapeXml(spot.description.slice(0, 34))}</text><text x="${x + 24}" y="${y + 140}" font-size="12" fill="${palette.muted}">写真未設定のため文章カードで表示</text>` }).join('')
  await save('photo-story', 1320, 1868, shell(1320, 1868, '写真でめぐる 有松', `<rect x="72" y="318" width="850" height="640" fill="none" stroke="${palette.accent}" stroke-width="4"/><text x="80" y="995" font-size="25" font-weight="700" fill="${palette.accent}">見どころ</text>${storyCards}`), portraitMap)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
