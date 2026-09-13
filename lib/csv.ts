export interface ParsedCsv {
  rows: string[][]
  error: string | null
}

export function parseCsv(source: string): ParsedCsv {
  const text = source.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"'
        index += 1
      }
      else if (character === '"') quoted = false
      else value += character
      continue
    }
    if (character === '"' && value === '') quoted = true
    else if (character === ',') {
      row.push(value)
      value = ''
    }
    else if (character === '\n') {
      row.push(value.replace(/\r$/, ''))
      if (row.some(cell => cell !== '')) rows.push(row)
      row = []
      value = ''
    }
    else value += character
  }
  if (quoted) return { rows, error: '引用符が閉じていません。' }
  row.push(value.replace(/\r$/, ''))
  if (row.some(cell => cell !== '')) rows.push(row)
  return { rows, error: null }
}

export function encodeCsv(rows: string[][]) {
  const escaped = rows.map(row => row.map((value) => {
    const normalized = String(value)
    return /[",\r\n]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized
  }).join(','))
  return `\uFEFF${escaped.join('\r\n')}\r\n`
}
