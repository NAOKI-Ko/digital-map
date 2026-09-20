import { readFile } from 'node:fs/promises'
import { ARIMATSU_USERS, ARIMATSU_WORKSPACES } from './arimatsu-baseline-lib'

type Json = Record<string, any>

async function main() {
  const baseUrl = (process.env.QA_BASE_URL || '').replace(/\/$/, '')
  const credentialPath = process.env.QA_BASELINE_CREDENTIALS_PATH
  if (!baseUrl || !credentialPath) throw new Error('QA_BASE_URL and QA_BASELINE_CREDENTIALS_PATH are required')
  if (!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl) && process.env.QA_BASELINE_ENV !== 'windows-qa') throw new Error('Local browser audit requires a localhost QA_BASE_URL')
  const credentialRows = (await readFile(credentialPath, 'utf8')).trim().split('\n').map(line => {
    const [displayName, email, password] = line.split('\t')
    if (!displayName || !email || !password) throw new Error('Invalid credential file format')
    return { displayName, email, password }
  })
  const expectedNames = new Set(ARIMATSU_USERS.map(user => user.displayName))
  if (credentialRows.length !== 3 || credentialRows.some(row => !expectedNames.has(row.displayName as any))) throw new Error('Credential file does not contain the exact WU-53 users')

  const results: Array<Record<string, unknown>> = []
  for (const credential of credentialRows) {
    let cookie = ''
    const request = async (path: string, options: RequestInit = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: { accept: 'application/json', 'content-type': 'application/json', origin: baseUrl, ...(cookie ? { cookie } : {}), ...options.headers },
        redirect: 'manual',
      })
      const setCookies = response.headers.getSetCookie?.() ?? []
      if (setCookies.length) cookie = setCookies.map(value => value.split(';')[0]).join('; ')
      const text = await response.text()
      let body: Json | string = text
      try { body = text ? JSON.parse(text) : {} } catch {}
      return { response, body }
    }

    const login = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: credential.email, password: credential.password }) })
    if (!login.response.ok || !cookie) throw new Error(`Login failed for ${credential.displayName}`)
    const organizationsResult = await request('/api/organizations')
    const organizations = (organizationsResult.body as Json).organizations as Array<{ id: string, name: string, role: string }>
    if (!organizationsResult.response.ok || organizations?.length !== 3) throw new Error(`${credential.displayName} cannot see all 3 Workspaces`)

    const workspaceChecks: Array<Record<string, unknown>> = []
    for (const organization of organizations) {
      const switched = await request('/api/organizations/active', { method: 'POST', body: JSON.stringify({ tenantId: organization.id }) })
      if (!switched.response.ok) throw new Error(`${credential.displayName} could not switch to ${organization.name}`)
      const mapsResult = await request('/api/maps')
      const mapsBody = mapsResult.body as Json
      if (!mapsResult.response.ok || mapsBody.maps?.length !== 1) throw new Error(`${credential.displayName} cannot access the Map in ${organization.name}`)
      const map = mapsBody.maps[0]
      const mapResult = await request(`/api/maps/${map.id}`)
      if (!mapResult.response.ok) throw new Error(`${credential.displayName} cannot read ${organization.name} Map as editor/owner`)
      const isOwner = organization.name === `有松マップ｜${credential.displayName}`
      if (organization.role !== (isOwner ? 'OWNER' : 'MEMBER')) throw new Error(`${credential.displayName} role mismatch in ${organization.name}`)
      if (Boolean((mapResult.body as Json).map?.permissions?.isOwner) !== isOwner) throw new Error(`${credential.displayName} owner control mismatch in ${organization.name}`)
      const ownerOnly = await request('/api/organization/members')
      if (isOwner) {
        if (!ownerOnly.response.ok || (ownerOnly.body as Json).members?.length !== 3) throw new Error(`Owner controls unavailable in ${organization.name}`)
        const publication = await request(`/api/maps/${map.id}/publish`, { method: 'POST', body: JSON.stringify({ isPublished: true }) })
        if (!publication.response.ok || !(publication.body as Json).publication?.isPublished) throw new Error(`Normal publish flow failed for ${map.slug}`)
      }
      else if (ownerOnly.response.status !== 403) throw new Error(`Owner-only operation was not blocked in ${organization.name}`)
      workspaceChecks.push({ workspace: organization.name, role: organization.role, mapSlug: map.slug, mapAccessible: true, ownerControls: isOwner ? 'visible' : 'blocked' })
    }
    results.push({ displayName: credential.displayName, loginAlias: credential.email, workspacesVisible: organizations.length, workspaceChecks })
  }

  const publicChecks = []
  for (const workspace of ARIMATSU_WORKSPACES) {
    const response = await fetch(`${baseUrl}/${workspace.mapSlug}`)
    const text = await response.text()
    if (!response.ok || !text.includes('有松マップ')) throw new Error(`Public Map failed: /${workspace.mapSlug}`)
    publicChecks.push({ path: `/${workspace.mapSlug}`, status: response.status })
  }
  const ready = await fetch(`${baseUrl}/api/ready`)
  if (!ready.ok) throw new Error(`/api/ready returned ${ready.status}`)
  console.info(JSON.stringify({ status: 'PASS', accounts: results, publicChecks, readyStatus: ready.status }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Browser QA failed'); process.exitCode = 1 })
