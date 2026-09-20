import { homedir } from 'node:os'
import { parse, resolve } from 'node:path'
import { databaseName } from '../backup-lib'

export const RESET_CONFIRMATION = 'I_UNDERSTAND_THIS_REPLACES_QA_DATA'
export const ARIMATSU_USERS = [
  { key: 'fon', displayName: 'ふぉん', defaultEmail: 'fon@arimatsu.test', emailEnv: 'ARIMATSU_FON_EMAIL' },
  { key: 'tama', displayName: 'たま', defaultEmail: 'tama@arimatsu.test', emailEnv: 'ARIMATSU_TAMA_EMAIL' },
  { key: 'nau', displayName: 'なう', defaultEmail: 'nau@arimatsu.test', emailEnv: 'ARIMATSU_NAU_EMAIL' },
] as const

export const ARIMATSU_WORKSPACES = [
  { key: 'fon', name: '有松マップ｜ふぉん', tenantSlug: 'arimatsu-workspace-fon', mapSlug: 'arimatsu-fon' },
  { key: 'tama', name: '有松マップ｜たま', tenantSlug: 'arimatsu-workspace-tama', mapSlug: 'arimatsu-tama' },
  { key: 'nau', name: '有松マップ｜なう', tenantSlug: 'arimatsu-workspace-nau', mapSlug: 'arimatsu-nau' },
] as const

const courseSource = 'https://www.city.nagoya.jp/midori/miryoku/1024793/1024794/1024796.html'

export const ARIMATSU_SPOTS = [
  { name: '有松駅', category: '交通', description: '有松の町並み散策の起点となる名鉄名古屋本線の駅です。', sources: [courseSource] },
  { name: '有松山車会館', category: '歴史・文化', description: '有松に伝わる三台の山車と祭礼文化を紹介する施設です。', sources: [courseSource] },
  { name: '竹田庄九郎碑', category: '有松絞り', description: '有松絞りの開祖とされる竹田庄九郎を顕彰する碑です。', sources: [courseSource] },
  { name: '有松・鳴海絞会館', category: '有松絞り', description: '有松・鳴海絞りの歴史や技法に触れられる施設です。', sources: [courseSource, 'https://www.nagoya-info.jp/spot/detail/19/'] },
  { name: '服部邸', category: '歴史・文化', description: '旧東海道沿いに残る、有松の絞商の歴史を伝える町家です。', sources: [courseSource] },
  { name: '常夜燈', category: '歴史・文化', description: '旧東海道の歴史を伝える石造の常夜燈です。', sources: [courseSource] },
  { name: '竹田邸', category: '歴史・文化', description: '有松の伝統的な町並みを構成する絞商の町家です。', sources: [courseSource] },
  { name: '岡家住宅', category: '歴史・文化', description: '江戸時代末期の絞問屋の建築形態をよく残す町家です。', sources: [courseSource, 'https://www.city.nagoya.jp/kankou/kankouinfo/1013766/1013962/1034451/1013983.html'] },
  { name: '小塚邸', category: '歴史・文化', description: '旧東海道沿いに残る有松の伝統的な町家です。', sources: [courseSource] },
  { name: '有松天満社', category: '寺社', description: '有松の町並みを見下ろす高台に鎮座する神社です。', sources: [courseSource] },
  { name: '祇園寺', category: '寺社', description: '有松の歴史散策路に含まれる寺院です。', sources: [courseSource] },
  { name: '有松神社', category: '寺社', description: '有松の歴史散策路に含まれる神社です。', sources: [courseSource] },
  { name: '桶狭間古戦場公園', category: '歴史・文化', description: '桶狭間の戦いにまつわる史跡を保存する公園です。', sources: [courseSource] },
  { name: '長福寺', category: '寺社', description: '桶狭間の戦いに関わる史跡を伝える寺院です。', sources: [courseSource] },
  { name: '桶狭間神明社', category: '寺社', description: '桶狭間地区の歴史散策路に含まれる神社です。', sources: [courseSource] },
  { name: '戦評の松', category: '歴史・文化', description: '桶狭間の戦いにまつわる伝承を伝える史跡です。', sources: [courseSource] },
] as const

export interface BaselinePrebackupMarker {
  verified: true
  databaseName: string
  createdAt: string
  components: { db: true, media: true, public: true }
  paths: { db: string, media: string, public: string }
}

export function assertSafeQaPath(candidate: string, label: string) {
  const value = resolve(candidate)
  const root = parse(value).root
  const forbidden = new Set([root, resolve(homedir()), resolve(process.cwd())])
  if (forbidden.has(value) || value.length <= root.length + 3) throw new Error(`${label} is an unsafe broad path`)
  return value
}

export function validateResetEnvironment(env: NodeJS.ProcessEnv) {
  if (env.QA_BASELINE_ENV !== 'local' && env.QA_BASELINE_ENV !== 'windows-qa') throw new Error('QA_BASELINE_ENV must be local or windows-qa')
  if (env.DEPLOYMENT_ENV === 'production') throw new Error('Production baseline reset is refused')
  if (env.QA_BASELINE_ENV === 'windows-qa' && env.DEPLOYMENT_ENV !== 'qa') throw new Error('windows-qa reset requires DEPLOYMENT_ENV=qa')
  if (env.ALLOW_QA_BASELINE_RESET !== RESET_CONFIRMATION) throw new Error('Missing destructive reset confirmation token')
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const actualDatabase = databaseName(env.DATABASE_URL)
  if (!env.EXPECTED_DATABASE_NAME || env.EXPECTED_DATABASE_NAME !== actualDatabase) throw new Error('EXPECTED_DATABASE_NAME does not match DATABASE_URL')
  if (env.PUBLIC_STORAGE_DRIVER !== 'local') throw new Error('PUBLIC_STORAGE_DRIVER must be local; R2 is refused')
  if (!env.QA_BASELINE_PREBACKUP_MARKER) throw new Error('Verified pre-reset backup marker is required')
  assertSafeQaPath(env.NUXT_UPLOAD_DIR || 'public/uploads', 'Managed media root')
  assertSafeQaPath(env.PUBLIC_STORAGE_ROOT || 'storage/public', 'Public storage root')
  return { environment: env.QA_BASELINE_ENV, databaseName: actualDatabase, markerPath: resolve(env.QA_BASELINE_PREBACKUP_MARKER) }
}

export function validatePrebackupMarker(value: unknown, expectedDatabase: string): asserts value is BaselinePrebackupMarker {
  const marker = value as Partial<BaselinePrebackupMarker> | null
  if (!marker || marker.verified !== true || marker.databaseName !== expectedDatabase) throw new Error('Pre-reset backup marker is not verified for the target database')
  if (!marker.components?.db || !marker.components.media || !marker.components.public) throw new Error('Pre-reset backup marker must cover DB, Media, and Public Storage')
  if (!marker.paths?.db || !marker.paths?.media || !marker.paths?.public || !marker.createdAt || Number.isNaN(Date.parse(marker.createdAt))) throw new Error('Pre-reset backup marker is incomplete')
}
