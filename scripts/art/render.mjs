import sharp from 'sharp'
import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '../../assets/visitor-maps/nagoya-aquarium')
for (const name of (await readdir(root)).filter(name => name.endsWith('-master.svg'))) {
  await sharp(resolve(root, name), { density: 144 }).png().toFile(resolve(root, name.replace('.svg', '.png')))
}
for (const name of (await readdir(resolve(root, 'icons'))).filter(name => name.endsWith('.svg'))) {
  await sharp(resolve(root, 'icons', name)).png().toFile(resolve(root, 'icons', name.replace('.svg', '.png')))
}
