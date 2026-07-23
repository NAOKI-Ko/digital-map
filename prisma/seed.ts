import 'dotenv/config'
import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { PrismaClient } from './generated/client'

const connectionString =
  process.env.DATABASE_URL
  ?? 'postgresql://digital_map:digital_map@localhost:5432/digital_map?schema=public'

const tenantName = process.env.SEED_TENANT_NAME ?? 'デジタルマップ運営'
const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'default'
const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase()
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-before-production'
const uploadDirectory = resolve(process.env.NUXT_UPLOAD_DIR ?? 'public/uploads')
const arimatsuDemoAssetDirectory = fileURLToPath(
  new URL('./seed-assets/arimatsu-demo/', import.meta.url),
)

const verificationMaps = [
  {
    name: '湯かおり温泉郷(テスト)',
    slug: 'test-yukaori-onsen',
    floor: {
      id: 'seed-floor-yukaori-onsen',
      name: '全体マップ',
      illustrationUrl: '/uploads/sample-onsen-illustration.png',
      imageWidth: 1600,
      imageHeight: 2000,
    },
  },
  {
    name: '里山リゾート みのりの杜(テスト)',
    slug: 'test-satoyama-minori-resort',
    floor: {
      id: 'seed-floor-satoyama-minori-resort',
      name: '全体マップ',
      illustrationUrl: '/uploads/sample-satoyama-resort-illustration.png',
      imageWidth: 2000,
      imageHeight: 1400,
    },
  },
] as const

const arimatsuDemoAssets = [
  { source: 'arimatsu-map.png', target: 'arimatsu-demo-map.png' },
  { source: 'custom-icon-stamp.png', target: 'custom-icon-stamp.png' },
  { source: 'illustration-shop.png', target: 'illustration-shop.png' },
  { source: 'illustration-torii.png', target: 'illustration-torii.png' },
  { source: 'illustration-tree.png', target: 'illustration-tree.png' },
] as const

const arimatsuDemoSpots = [
  {
    id: 'demo-arimatsu-01',
    name: '有松・鳴海絞会館',
    category: '観光・史跡',
    description: '有松・鳴海絞りの歴史と技法を、展示や職人の実演を通して学べる施設です。町歩きの最初に立ち寄ると、有松の見どころをつかみやすくなります。',
    lat: 35.06839308983276,
    lng: 136.967725580873,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-shibori-kaikan-1/600/400',
      'https://picsum.photos/seed/arimatsu-shibori-kaikan-2/600/400',
    ],
    hoursText: '9:30〜17:00',
    holidayText: '年末年始・臨時休館あり',
    phone: '052-621-0111',
    pinIconType: 'preset',
    pinIconId: 'kanji:観',
    pinIconImageUrl: null,
    pinColor: '#C7401F',
  },
  {
    id: 'demo-arimatsu-02',
    name: '竹田嘉兵衛商店',
    category: '土産物',
    description: '江戸期から続く有松絞りの老舗で、伝統の技法を受け継いだ着物や染色品に出会えます。歴史ある商家のたたずまいも町並みの見どころです。',
    lat: 35.068145480727274,
    lng: 136.96845020095333,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-takeda-kahei-1/600/400',
    ],
    hoursText: null,
    holidayText: null,
    phone: null,
    pinIconType: 'preset',
    pinIconId: 'kanji:買',
    pinIconImageUrl: null,
    pinColor: '#7C3AED',
  },
  {
    id: 'demo-arimatsu-03',
    name: 'まり木綿',
    category: '土産物',
    description: '伝統技法を明るい色柄へ展開する、有松発のテキスタイルブランドです。手ぬぐいや小物など、日常に取り入れやすい絞り製品を選べます。',
    lat: 35.06792490891333,
    lng: 136.96917505836873,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-marimomen-1/600/400',
      'https://picsum.photos/seed/arimatsu-marimomen-2/600/400',
    ],
    hoursText: '10:00〜16:00（月・金）、10:00〜17:00（土・日）',
    holidayText: '火・水・木曜',
    phone: '052-693-9030',
    pinIconType: 'preset',
    pinIconId: 'kanji:買',
    pinIconImageUrl: null,
    pinColor: '#D97706',
  },
  {
    id: 'demo-arimatsu-04',
    name: '寿限無茶屋',
    category: '食事処',
    description: '歴史ある町家で、手打ちうどんや季節の料理を味わえる食事処です。旧東海道散策の途中で落ち着いて休憩できます。',
    lat: 35.06751313356696,
    lng: 136.97022859811855,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-jugemuchaya-1/600/400',
    ],
    hoursText: '11:00〜15:00／17:00〜21:30',
    holidayText: '木曜・水曜夜・第3水曜',
    phone: '052-624-5006',
    pinIconType: 'preset',
    pinIconId: 'kanji:食',
    pinIconImageUrl: null,
    pinColor: '#047857',
  },
  {
    id: 'demo-arimatsu-05',
    name: 'カフェ 庄九郎',
    category: 'カフェ',
    description: '有松絞りの開祖ゆかりの町家を生かしたカフェです。歴史的な空間と現代的な料理・甘味を一緒に楽しめます。',
    lat: 35.067185189583526,
    lng: 136.97082036872152,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-shokuro-1/600/400',
      'https://picsum.photos/seed/arimatsu-shokuro-2/600/400',
    ],
    hoursText: '11:00〜16:00／17:00〜21:00（夜は予約制）',
    holidayText: '月曜',
    phone: '052-627-2055',
    pinIconType: 'preset',
    pinIconId: 'kanji:食',
    pinIconImageUrl: null,
    pinColor: '#C7401F',
  },
  {
    id: 'demo-arimatsu-06',
    name: '石窯パン ダーシェンカ・蔵',
    category: 'カフェ・パン',
    description: '天然酵母と石窯焼きのパンを扱う、町家の雰囲気になじむベーカリーです。中庭やカフェスペースで散策途中のひと休みもできます。',
    lat: 35.06683040255771,
    lng: 136.97137886762135,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-dasenka-kura-1/600/400',
    ],
    hoursText: '10:00〜17:00（カフェ11:00〜16:00）',
    holidayText: '月・火曜',
    phone: '052-624-0050',
    pinIconType: 'preset',
    pinIconId: 'material:local_cafe',
    pinIconImageUrl: null,
    pinColor: '#2563EB',
  },
  {
    id: 'demo-arimatsu-07',
    name: '絞りのやまがみ',
    category: '土産物',
    description: '職人の手仕事を身近に感じられる有松絞りの専門店です。ストールや服飾小物など、普段使いしやすい品を探せます。',
    lat: 35.0664756155319,
    lng: 136.9719373665212,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-yamagami-1/600/400',
      'https://picsum.photos/seed/arimatsu-yamagami-2/600/400',
    ],
    hoursText: null,
    holidayText: null,
    phone: '052-623-2186',
    pinIconType: 'preset',
    pinIconId: 'material:storefront',
    pinIconImageUrl: null,
    pinColor: '#7C3AED',
  },
  {
    id: 'demo-arimatsu-08',
    name: '有松山車会館',
    category: '観光・史跡',
    description: '有松に伝わる山車と祭礼文化を紹介する展示施設です。精巧なからくり人形や装飾を間近で見られます。',
    lat: 35.06603991088064,
    lng: 136.9724621190477,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-dashi-kaikan-1/600/400',
    ],
    hoursText: '10:00〜16:00',
    holidayText: '月〜金曜・年末年始（原則、土・日曜のみ開館）',
    phone: '052-621-0111',
    pinIconType: 'custom',
    pinIconId: null,
    pinIconImageUrl: '/uploads/custom-icon-stamp.png',
    pinColor: '#C7401F',
  },
  {
    id: 'demo-arimatsu-09',
    name: '岡家住宅',
    category: '観光・史跡',
    description: '江戸末期の絞商の姿を今に伝える、大規模な町家建築です。旧東海道の商家の構えや内部空間を観察できます。',
    lat: 35.06560440047855,
    lng: 136.9729538372062,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-oke-residence-1/600/400',
      'https://picsum.photos/seed/arimatsu-oke-residence-2/600/400',
    ],
    hoursText: '10:30〜15:30（土・日曜）',
    holidayText: '平日・年末年始',
    phone: '052-972-2782',
    pinIconType: 'illustration',
    pinIconId: null,
    pinIconImageUrl: '/uploads/illustration-shop.png',
    pinColor: '#C7401F',
  },
  {
    id: 'demo-arimatsu-10',
    name: '有松天満社',
    category: '神社・史跡',
    description: '菅原道真公をまつり、有松の山車祭りとも深く結びつく神社です。高台の境内から町の歴史を感じられます。',
    lat: 35.06516889007645,
    lng: 136.97344555536472,
    photosJson: [
      'https://picsum.photos/seed/arimatsu-tenmansha-1/600/400',
    ],
    hoursText: null,
    holidayText: null,
    phone: null,
    pinIconType: 'illustration',
    pinIconId: null,
    pinIconImageUrl: '/uploads/illustration-torii.png',
    pinColor: '#C7401F',
  },
]

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function copyArimatsuDemoAssets() {
  await mkdir(uploadDirectory, { recursive: true })
  await Promise.all(arimatsuDemoAssets.map(asset => copyFile(
    resolve(arimatsuDemoAssetDirectory, asset.source),
    resolve(uploadDirectory, asset.target),
  )))

  console.info(`有松デモ用画像を配置しました: ${uploadDirectory}`)
}

async function seedArimatsuDemo(tenantId: string) {
  await copyArimatsuDemoAssets()

  const map = await prisma.map.upsert({
    where: { slug: 'team-demo-arimatsu' },
    update: {
      tenantId,
      name: '有松（チーム内デモ）',
      isPublished: false,
    },
    create: {
      id: 'demo-arimatsu-map',
      tenantId,
      name: '有松（チーム内デモ）',
      slug: 'team-demo-arimatsu',
      isPublished: false,
    },
  })

  const floor = await prisma.mapFloor.upsert({
    where: { id: 'demo-arimatsu-floor' },
    update: {
      mapId: map.id,
      name: '有松町（デモ）',
      illustrationUrl: '/uploads/arimatsu-demo-map.png',
      imageWidth: 1448,
      imageHeight: 1086,
      order: 0,
      refAPixelX: 55.47892720306513,
      refAPixelY: 36.06130268199234,
      refALat: 35.06912258387551,
      refALng: 136.96684317481913,
      refBPixelX: 1217.7624521072796,
      refBPixelY: 1056.8735632183907,
      refBLat: 35.06355742961577,
      refBLng: 136.97447378024134,
    },
    create: {
      id: 'demo-arimatsu-floor',
      mapId: map.id,
      name: '有松町（デモ）',
      illustrationUrl: '/uploads/arimatsu-demo-map.png',
      imageWidth: 1448,
      imageHeight: 1086,
      order: 0,
      refAPixelX: 55.47892720306513,
      refAPixelY: 36.06130268199234,
      refALat: 35.06912258387551,
      refALng: 136.96684317481913,
      refBPixelX: 1217.7624521072796,
      refBPixelY: 1056.8735632183907,
      refBLat: 35.06355742961577,
      refBLng: 136.97447378024134,
    },
  })

  await prisma.$transaction(arimatsuDemoSpots.map((spot) => {
    const { id, ...spotData } = spot
    const data = {
      floorId: floor.id,
      ...spotData,
      isPublished: false,
    }

    return prisma.spot.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    })
  }))

  console.info(`有松チーム内デモを作成しました: ${arimatsuDemoSpots.length}スポット（すべて下書き）`)
}

async function main() {
  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD は12文字以上で指定してください。')
  }

  const passwordHash = await hash(adminPassword, 12)
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: {
      name: tenantName,
      slug: tenantSlug,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      tenantId: tenant.id,
      passwordHash,
      role: 'admin',
    },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  })

  console.info(`管理者を作成しました: ${admin.email} (${tenant.name})`)

  for (const verificationMap of verificationMaps) {
    const map = await prisma.map.upsert({
      where: { slug: verificationMap.slug },
      update: {
        tenantId: tenant.id,
        name: verificationMap.name,
        isPublished: false,
      },
      create: {
        tenantId: tenant.id,
        name: verificationMap.name,
        slug: verificationMap.slug,
        isPublished: false,
      },
    })

    await prisma.mapFloor.upsert({
      where: { id: verificationMap.floor.id },
      update: {
        mapId: map.id,
        name: verificationMap.floor.name,
        illustrationUrl: verificationMap.floor.illustrationUrl,
        imageWidth: verificationMap.floor.imageWidth,
        imageHeight: verificationMap.floor.imageHeight,
        order: 0,
      },
      create: {
        id: verificationMap.floor.id,
        mapId: map.id,
        name: verificationMap.floor.name,
        illustrationUrl: verificationMap.floor.illustrationUrl,
        imageWidth: verificationMap.floor.imageWidth,
        imageHeight: verificationMap.floor.imageHeight,
        order: 0,
      },
    })

    console.info(`実地確認用マップを作成しました: ${verificationMap.name}`)
  }

  await seedArimatsuDemo(tenant.id)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
