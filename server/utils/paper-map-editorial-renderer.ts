import sharp from 'sharp'
import { getPinIconPreset } from '~~/shared/constants/spot'
import type { SpotCategorySummary } from '~~/shared/types/category'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import type { PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapSource } from '~~/shared/types/paper-map'
import {
  resolveEditorialDocument,
  editorialText,
  type EditorialText,
} from '~~/shared/utils/paper-map-editorial'
import { paperPrintTokens } from '~~/shared/utils/paper-map-designs'
import { viewportPoint, type PaperRect } from '~~/shared/utils/paper-map-layout'
import { slotVisible } from '~~/shared/utils/paper-map-templates'
import { publicMapQrPayload, readMapAsset } from './map-pdf'
import type { PaperRenderOptions } from './paper-map-document-renderer'
const xml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  )
const txt = (
  t: EditorialText,
  x: number,
  y: number,
  size: number,
  leading: number,
  color: string,
  weight = 400,
  family = '',
) =>
  t.lines
    .map(
      (s, i) =>
        `<text x="${x}" y="${y + i * leading}" font-size="${size}" font-weight="${weight}" fill="${color}" ${family ? `style="font-family:${xml(family)}"` : ''}>${xml(s)}</text>`,
    )
    .join('')
const image = (url: string, r: PaperRect, fit = 'xMidYMid meet') =>
  `<image href="${xml(url)}" x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" preserveAspectRatio="${fit}"/>`
const rect = (r: PaperRect, fill: string, rx = 0, stroke = 'none') =>
  `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width=".75"/>`
export function createEditorialRenderer(
  source: PaperMapSource,
  config: PaperMapConfig,
  options: PaperRenderOptions,
) {
  const document = resolveEditorialDocument(source, config),
    warnings = new Set(document.warnings)
  const bytesCache = new Map<string, Promise<Buffer | null>>(),
    images = new Map<string, Promise<string | null>>()
  async function asset(
    url: string | null,
    w: number,
    h: number,
    required = false,
  ) {
    if (!url) {
      if (required)
        throw Object.assign(new Error('地図画像がありません。'), {
          statusCode: 422,
          statusMessage: '地図画像がありません。',
        })
      return null
    }
    if (
      !url.startsWith('/uploads/') &&
      !url.startsWith('/api/public-assets/')
    ) {
      if (required)
        throw Object.assign(
          new Error('地図画像は登録済みの画像を指定してください。'),
          { statusCode: 422 },
        )
      warnings.add('登録済み画像ではないため表示できない画像があります。')
      return null
    }
    const key = `${url}:${Math.ceil(w)}:${Math.ceil(h)}`
    if (!images.has(key))
      images.set(
        key,
        (async () => {
          if (!bytesCache.has(url))
            bytesCache.set(
              url,
              readMapAsset(url, options.uploadDirectory, options.storage),
            )
          const bytes = await bytesCache.get(url)
          if (!bytes) return null
          try {
            const png = await sharp(bytes)
              .rotate()
              .resize({
                width: Math.ceil((w * paperPrintTokens.dpi) / 72),
                height: Math.ceil((h * paperPrintTokens.dpi) / 72),
                fit: 'inside',
                withoutEnlargement: true,
              })
              .png()
              .toBuffer()
            return 'data:image/png;base64,' + png.toString('base64')
          } catch {
            return null
          }
        })(),
      )
    const value = await images.get(key)
    if (!value) {
      if (required)
        throw Object.assign(new Error('地図画像を読み込めません。'), {
          statusCode: 422,
          statusMessage: '地図画像を読み込めません。',
        })
      warnings.add(
        '読み込めない写真・カテゴリー画像・ロゴがあります。元データを確認してください。',
      )
    }
    return value ?? null
  }
  async function render(
    pageIndex: number,
    dpi = 150,
    format: 'png' | 'jpeg' = 'png',
  ) {
    const page = document.pages[pageIndex]
    if (!page)
      throw Object.assign(new Error('表示できる紙面がありません。'), {
        statusCode: 422,
      })
    const d = document,
      p = d.theme,
      m = d.margin,
      w = d.width,
      h = d.height,
      parts: string[] = []
    parts.push(rect({ x: 0, y: 0, width: w, height: h }, p.paper))
    // Nonsemantic identity graphics stay outside source map geometry.
    parts.push(
      rect({ x: 0, y: 0, width: w, height: 9 }, p.primary),
      rect(
        {
          x: m,
          y: m,
          width: 4,
          height: Math.min(75, d.title.lines.length * 38 + 20),
        },
        p.accent,
      ),
    )
    if (d.themeId === 'heritage')
      for (let i = 0; i < 9; i++)
        parts.push(
          `<path d="M ${w - m - 9 - i * 9} 12 l 8 8 l -8 8 l -8 -8 Z" fill="none" stroke="${p.secondary}" stroke-width=".75"/>`,
        )
    if (d.themeId === 'leisure')
      parts.push(
        `<circle cx="${w - 110}" cy="35" r="23" fill="#f7d975"/><circle cx="${w - 153}" cy="20" r="10" fill="${p.secondary}"/>`,
      )
    if (d.themeId === 'alpine')
      parts.push(
        `<path d="M ${w - 160} 16 h 120 m -120 5 h 85 m -85 5 h 50" fill="none" stroke="${p.secondary}" stroke-width="2"/>`,
      )
    parts.push(txt(d.title, m + 15, m + 30, 32, 38, p.ink, 700, p.titleFamily))
    let y = m + d.title.lines.length * 38 + 9
    parts.push(txt(d.subtitle, m + 15, y, 10, 14, p.muted))
    y += d.subtitle.lines.length * 14
    if (d.intro.lines.length) {
      parts.push(txt(d.intro, m + 15, y + 7, 10, 14, p.ink))
      y += d.intro.lines.length * 14 + 8
    }
    if (d.notice.lines.length) {
      parts.push(
        rect(
          {
            x: m,
            y: y + 4,
            width: w - m * 2,
            height: d.notice.lines.length * 12 + 12,
          },
          p.secondary,
          p.radius,
        ),
      )
      parts.push(txt(d.notice, m + 12, y + 17, 9.5, 12, p.ink))
    }
    if (slotVisible(config, 'logo') && source.map.logoUrl) {
      const logo = await asset(source.map.logoUrl, 54, 54)
      if (logo)
        parts.push(
          image(logo, { x: w - m - 54, y: m + 8, width: 54, height: 54 }),
        )
    }
    const marker = (x: number, y: number, n: number, r = 8) => {
      const shape =
        d.themeId === 'leisure'
          ? `<circle cx="${x}" cy="${y}" r="${r + 1}" fill="${p.primary}" stroke="white" stroke-width="1.5"/>`
          : `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${d.themeId === 'heritage' ? 2 : 0}" fill="${p.primary}" stroke="white" stroke-width="1.4"/>`
      return (
        shape +
        `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="${n > 99 ? 7 : 9}" font-weight="700" fill="white">${n}</text>`
      )
    }
    async function categoryBadge(
      category: SpotCategorySummary,
      x: number,
      y: number,
      size: number,
    ) {
      const icon = await asset(category.iconImageUrl, size, size)
      if (icon) return image(icon, { x, y, width: size, height: size })
      const preset = category.iconPresetId
        ? getPinIconPreset(category.iconPresetId)
        : null
      // Material font ligatures are not available in the PDF renderer. Use the
      // source preset's Japanese label, never infer a service from the theme.
      const label = preset
        ? preset.family === 'kanji'
          ? preset.symbol
          : Array.from(preset.label).slice(0, 2).join('')
        : Array.from(category.name).slice(0, 1).join('')
      return (
        rect({ x, y, width: size, height: size }, p.secondary, p.radius) +
        `<text x="${x + size / 2}" y="${y + size * 0.68}" text-anchor="middle" font-size="${label.length > 1 ? size * 0.43 : size * 0.6}" font-weight="700" fill="${p.primary}">${xml(label)}</text>`
      )
    }
    if (page.mapFrame && page.imageRect) {
      const frame = page.mapFrame,
        r = page.imageRect,
        v = page.viewport
      let cx = frame.x
      if (slotVisible(config, 'categoryLegend'))
        for (const c of d.categories) {
          const label = editorialText(c.name, 83, 9, 1),
            cw = 22 + Math.min(83, Array.from(c.name).length * 9) + 9
          if (cx + cw > frame.x + frame.width) break
          parts.push(await categoryBadge(c, cx, frame.y, 18))
          parts.push(txt(label, cx + 23, frame.y + 13, 9, 12, p.ink))
          cx += cw
        }
      parts.push(
        rect(
          { x: r.x - 3, y: r.y - 3, width: r.width + 6, height: r.height + 6 },
          '#ffffff',
          p.radius,
          p.secondary,
        ),
      )
      parts.push(
        `<defs><clipPath id="map"><rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${p.radius}"/></clipPath></defs><g clip-path="url(#map)">`,
      )
      const mapImage = await asset(
        page.floor.illustrationUrl,
        r.width / v.width,
        r.height / v.height,
        true,
      )
      parts.push(
        image(
          mapImage!,
          {
            x: r.x - (v.x / v.width) * r.width,
            y: r.y - (v.y / v.height) * r.height,
            width: r.width / v.width,
            height: r.height / v.height,
          },
          'none',
        ),
      )
      for (const dec of page.floor.decorations) {
        const point = viewportPoint(dec, v, r),
          dw = (dec.width / v.width) * r.width,
          dh = (dw * dec.imageHeight) / dec.imageWidth,
          a = await asset(dec.imageUrl, dw, dh)
        if (a)
          parts.push(
            `<g transform="translate(${point.x} ${point.y}) rotate(${dec.rotation})">${image(a, { x: -dw / 2, y: -dh / 2, width: dw, height: dh })}</g>`,
          )
      }
      for (const spot of page.floor.spots) {
        if (
          !d.numbers.has(spot.id) ||
          spot.x < v.x ||
          spot.x > v.x + v.width ||
          spot.y < v.y ||
          spot.y > v.y + v.height
        )
          continue
        const pt = viewportPoint(spot, v, r)
        parts.push(marker(pt.x, pt.y, d.numbers.get(spot.id)!, 7.7))
      }
      parts.push('</g>')
      for (const f of page.features) {
        const a = await asset(f.photo, f.rect.width, f.rect.height)
        if (!a) continue
        const id = `feature-${f.number}`
        parts.push(
          `<defs><clipPath id="${id}">${rect(f.rect, 'white', p.radius)}</clipPath></defs><g clip-path="url(#${id})">${image(a, f.rect, 'xMidYMid slice')}</g>`,
        )
        parts.push(
          txt(
            editorialText(`${f.number}  ${f.spot.name}`, f.rect.width, 9, 1),
            f.rect.x,
            f.rect.y + f.rect.height + 13,
            9,
            11,
            p.ink,
            600,
          ),
        )
      }
    }
    if (slotVisible(config, 'spotGuide')) {
      const f = page.guideFrame
      parts.push(
        rect({ x: f.x, y: f.y, width: 5, height: 16 }, p.accent, p.radius),
      )
      parts.push(
        txt(
          editorialText(
            (config.paperOriginal.sectionHeading || 'スポット案内') +
              (page.continuation ? ' / 続き' : ''),
            f.width - 20,
            12,
            1,
          ),
          f.x + 13,
          f.y + 13,
          12,
          16,
          p.ink,
          700,
        ),
      )
      for (const c of page.cards) {
        const a = c.photo
          ? await asset(c.photo, c.rect.width - 20, c.photoHeight)
          : null
        const r = {
          ...c.rect,
          height: c.rect.height - (c.photo && !a ? c.photoHeight + 10 : 0),
        }
        parts.push(
          rect(
            r,
            d.themeId === 'heritage' ? '#fffefa' : '#ffffff',
            p.radius,
            p.secondary,
          ),
        )
        let cy = r.y + 12
        if (a) {
          const pr = {
              x: r.x + 10,
              y: r.y + 10,
              width: r.width - 20,
              height: c.photoHeight,
            },
            id = `photo-${c.number}`
          parts.push(
            `<defs><clipPath id="${id}">${rect(pr, 'white', p.radius)}</clipPath></defs><g clip-path="url(#${id})">${image(a, pr, 'xMidYMid slice')}</g>`,
          )
          cy += c.photoHeight + 10
        }
        if (
          config.templateId === 'map-classic' &&
          slotVisible(config, 'categoryLegend')
        ) {
          const category = c.spot.categories[0]
          if (category)
            parts.push(
              await categoryBadge(category, r.x + r.width - 24, cy - 5, 16),
            )
        }
        parts.push(marker(r.x + 16, cy + 2, c.number, 8))
        parts.push(txt(c.name, r.x + 31, cy + 6, 11, 14, p.ink, 700))
        cy += c.name.lines.length * 14
        parts.push(txt(c.category, r.x + 31, cy + 4, 9, 12, p.accent))
        cy += c.category.lines.length * 12
        parts.push(txt(c.summary, r.x + 10, cy + 5, 9.5, 12.5, p.muted))
      }
    }
    const fy = h - m - 54
    parts.push(
      `<path d="M ${m} ${fy - 9} H ${w - m}" stroke="${p.primary}" stroke-width="1.2"/>`,
    )
    if (slotVisible(config, 'footer'))
      parts.push(
        txt(
          editorialText(config.paperOriginal.footer, w - m * 2 - 250, 9, 2),
          m,
          fy + 13,
          9,
          12,
          p.muted,
        ),
      )
    parts.push(
      `<text x="${m}" y="${h - m}" font-size="9" font-weight="700" fill="${p.primary}">${pageIndex + 1} / ${d.pages.length}</text>`,
    )
    if (
      slotVisible(config, 'qr') &&
      source.publicUrlAvailable !== false &&
      source.map.slug
    ) {
      const qr = await QRCode.toDataURL(
        publicMapQrPayload(options.publicBaseUrl, source.map.slug),
        { margin: 4, width: 280, errorCorrectionLevel: 'M' },
      )
      parts.push(
        rect(
          { x: w - m - 225, y: fy - 3, width: 225, height: 60 },
          p.secondary,
          p.radius,
        ),
      )
      parts.push(image(qr, { x: w - m - 55, y: fy + 2, width: 50, height: 50 }))
      parts.push(
        txt(
          editorialText(config.paperOriginal.qrLabel, 150, 9.5, 3),
          w - m - 215,
          fy + 19,
          9.5,
          12.5,
          p.ink,
          600,
        ),
      )
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif}</style>${parts.join('')}</svg>`
    const raster = sharp(Buffer.from(svg), { density: dpi }).flatten({
      background: p.paper,
    })
    return format === 'jpeg'
      ? raster
          .jpeg({
            quality: paperPrintTokens.jpegQuality,
            chromaSubsampling: '4:4:4',
          })
          .toBuffer()
      : raster.png().toBuffer()
  }
  return { document, warnings, render }
}
export async function generateEditorialPdf(
  source: PaperMapSource,
  config: PaperMapConfig,
  options: PaperRenderOptions,
) {
  const r = createEditorialRenderer(source, config, options)
  if (!r.document.pages.length)
    throw Object.assign(new Error('PDFに出力できるスポットがありません。'), {
      statusCode: 422,
    })
  const pdf = await PDFDocument.create()
  for (let i = 0; i < r.document.pages.length; i++) {
    const bytes = await r.render(i, paperPrintTokens.dpi, 'jpeg'),
      img = await pdf.embedJpg(bytes),
      p = pdf.addPage([r.document.width, r.document.height])
    p.drawImage(img, {
      x: 0,
      y: 0,
      width: r.document.width,
      height: r.document.height,
    })
  }
  pdf.setTitle(config.paperOriginal.title)
  pdf.setCreator('Digital Map')
  pdf.setSubject(
    `Paper ${config.templateId}@3 / ${config.design?.themeId}@1 / system 1`,
  )
  return Buffer.from(await pdf.save())
}
