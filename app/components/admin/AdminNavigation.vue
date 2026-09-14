<script setup lang="ts">
import AdminIcon from './AdminIcon.vue'
import type { AdminMapListResponse } from '~~/shared/types/map'
import {
  adminNavigationGroupLabels,
  buildAdminNavigation,
  isAdminNavigationItemActive,
  type AdminNavigationGroupId,
  type AdminNavigationItem,
} from '~/utils/admin-navigation'

const props = withDefaults(defineProps<{ expanded?: boolean, mobile?: boolean }>(), {
  expanded: false,
  mobile: false,
})
const emit = defineEmits<{ navigate: [], toggle: [] }>()
const route = useRoute()
const { logout, user } = useAuth()
const isLoggingOut = ref(false)
const isContextOpen = ref(false)
const { data: organizationData } = await useFetch('/api/organizations')
const { data: mapData } = await useFetch<AdminMapListResponse>('/api/maps')
const { data: assignedSpotData } = await useFetch<{ spots: Array<{ id: string }> }>('/api/spot-editor/spots')
const organizations = computed(() => organizationData.value?.organizations ?? [])
const maps = computed(() => mapData.value?.maps ?? [])
const activeOrganization = computed(() => organizations.value.find(item => item.id === organizationData.value?.activeOrganizationId))
const routeMapId = computed(() => typeof route.params.mapId === 'string' ? route.params.mapId : null)
const currentMap = computed(() => maps.value.find(map => map.id === routeMapId.value) ?? null)
const isOwner = computed(() => activeOrganization.value?.role === 'OWNER')
const showLabels = computed(() => props.mobile || props.expanded)
const navigation = computed(() => buildAdminNavigation({
  mapId: currentMap.value?.id ?? null,
  isOwner: isOwner.value,
  hasAssignedSpots: Boolean(assignedSpotData.value?.spots.length),
}))
const groupOrder: AdminNavigationGroupId[] = ['organization', 'map', 'operations', 'team', 'management']
const groupedNavigation = computed(() => groupOrder
  .map(id => ({ id, label: adminNavigationGroupLabels[id], items: navigation.value.filter(item => item.group === id) }))
  .filter(group => group.items.length))
const railNavigation = computed(() => navigation.value.filter(item => item.rail))
const contextLabel = computed(() => [activeOrganization.value?.name, currentMap.value?.name].filter(Boolean).join(' / ') || 'OrganizationとMapを選択')

function isActive(item: AdminNavigationItem) {
  return isAdminNavigationItemActive(item, route.path, route.hash)
}

async function switchOrganization(event: Event) {
  const select = event.target as HTMLSelectElement
  const tenantId = select.value
  if (!tenantId || tenantId === organizationData.value?.activeOrganizationId) return
  if (route.path !== '/admin/dashboard') {
    await navigateTo('/admin/dashboard')
    if (route.path !== '/admin/dashboard') {
      select.value = organizationData.value?.activeOrganizationId ?? ''
      return
    }
  }
  await $fetch('/api/organizations/active', { method: 'POST', body: { tenantId } })
  await reloadNuxtApp({ path: '/admin/dashboard', force: true })
}

async function switchMap(event: Event) {
  const select = event.target as HTMLSelectElement
  const mapId = select.value
  if (!mapId || mapId === currentMap.value?.id) return
  await navigateTo(`/admin/maps/${mapId}`)
  if (route.params.mapId !== mapId) select.value = currentMap.value?.id ?? ''
  else isContextOpen.value = false
}

function closeContextOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') isContextOpen.value = false
}

onMounted(async () => {
  if (organizations.value.length && !activeOrganization.value) {
    await $fetch('/api/organizations/active', { method: 'POST', body: { tenantId: organizations.value[0]!.id } })
    await reloadNuxtApp({ path: '/admin/dashboard', force: true })
  }
  window.addEventListener('keydown', closeContextOnEscape)
})
onBeforeUnmount(() => window.removeEventListener('keydown', closeContextOnEscape))

async function handleLogout() {
  isLoggingOut.value = true
  try { await logout() }
  finally { isLoggingOut.value = false }
}

function handleNavigate() {
  isContextOpen.value = false
  emit('navigate')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-stone-950 text-white">
    <div class="flex min-h-[4.5rem] items-center border-b border-white/10" :class="showLabels ? 'px-4' : 'justify-center px-2'">
      <NuxtLink to="/admin/dashboard" class="group relative flex min-h-11 items-center rounded-lg focus-visible:outline-white" :class="showLabels ? 'gap-3' : 'justify-center px-3'" aria-label="Digital Map マップ一覧" @click="handleNavigate">
        <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-terracotta-600 text-sm font-black shadow-sm">D</span>
        <span v-if="showLabels" class="min-w-0">
          <span class="block text-[0.65rem] font-semibold tracking-[0.2em] text-stone-400">DIGITAL MAP</span>
          <span class="mt-0.5 block truncate text-sm font-bold">マップ管理</span>
        </span>
        <span v-else class="admin-nav-tooltip">マップ一覧</span>
      </NuxtLink>
    </div>

    <div class="relative border-b border-white/10 p-2">
      <div v-if="showLabels" class="space-y-3 rounded-xl bg-white/[0.06] p-3">
        <label class="block text-[0.65rem] font-semibold uppercase tracking-wider text-stone-400">
          Organization
          <select :value="organizationData?.activeOrganizationId" class="mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-stone-900 px-3 text-sm font-semibold text-white" aria-label="Organizationを切り替える" @change="switchOrganization">
            <option v-for="organization in organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option>
          </select>
        </label>
        <label v-if="maps.length" class="block text-[0.65rem] font-semibold uppercase tracking-wider text-stone-400">
          Current Map
          <select :value="currentMap?.id ?? ''" class="mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-stone-900 px-3 text-sm font-semibold text-white" aria-label="Mapを切り替える" @change="switchMap">
            <option value="" disabled>Mapを選択</option>
            <option v-for="map in maps" :key="map.id" :value="map.id">{{ map.name }}</option>
          </select>
        </label>
      </div>
      <button v-else type="button" class="group relative flex min-h-11 w-full items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none" :aria-expanded="isContextOpen" aria-controls="admin-context-popover" :aria-label="contextLabel" :title="contextLabel" @click="isContextOpen = !isContextOpen">
        <AdminIcon name="switch" />
        <span class="admin-nav-tooltip">{{ contextLabel }}</span>
      </button>
      <div v-if="!showLabels && isContextOpen" id="admin-context-popover" class="absolute left-[4.25rem] top-2 z-50 w-72 rounded-xl border border-stone-200 bg-white p-4 text-stone-900 shadow-xl">
        <p class="text-xs font-semibold text-stone-500">Organization</p>
        <select :value="organizationData?.activeOrganizationId" class="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm" aria-label="Organizationを切り替える" @change="switchOrganization">
          <option v-for="organization in organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option>
        </select>
        <template v-if="maps.length">
          <p class="mt-4 text-xs font-semibold text-stone-500">Current Map</p>
          <select :value="currentMap?.id ?? ''" class="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm" aria-label="Mapを切り替える" @change="switchMap">
            <option value="" disabled>Mapを選択</option>
            <option v-for="map in maps" :key="map.id" :value="map.id">{{ map.name }}</option>
          </select>
        </template>
      </div>
    </div>

    <nav class="admin-navigation-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="管理画面メニュー">
      <template v-if="showLabels">
        <section v-for="group in groupedNavigation" :key="group.id" class="mb-4">
          <h2 class="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone-500">{{ group.label }}</h2>
          <div class="space-y-0.5">
            <NuxtLink v-for="item in group.items" :key="item.id" :to="item.to" class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors motion-reduce:transition-none" :class="isActive(item) ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-300 hover:bg-white/[0.08] hover:text-white'" :aria-current="isActive(item) ? 'page' : undefined" @click="handleNavigate">
              <AdminIcon :name="item.icon" class="shrink-0" /><span class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </section>
      </template>
      <div v-else class="space-y-1">
        <NuxtLink v-for="item in railNavigation" :key="item.id" :to="item.to" class="group relative flex min-h-11 items-center justify-center rounded-lg transition-colors motion-reduce:transition-none" :class="isActive(item) ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-400 hover:bg-white/10 hover:text-white'" :aria-current="isActive(item) ? 'page' : undefined" :aria-label="item.shortLabel" :title="item.shortLabel" @click="handleNavigate">
          <AdminIcon :name="item.icon" /><span class="admin-nav-tooltip">{{ item.shortLabel }}</span>
        </NuxtLink>
      </div>
    </nav>

    <div class="border-t border-white/10 p-2">
      <template v-if="showLabels">
        <div class="px-3 py-2"><p class="truncate text-xs text-stone-500">ログイン中</p><p class="mt-1 truncate text-sm font-medium text-stone-200">{{ user?.displayName || user?.email }}</p></div>
        <NuxtLink to="/admin/account/password" class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-300 hover:bg-white/[0.08] hover:text-white" @click="handleNavigate"><AdminIcon name="settings" /> パスワード変更</NuxtLink>
        <button type="button" :disabled="isLoggingOut" class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-50" @click="handleLogout"><AdminIcon name="logout" /> {{ isLoggingOut ? 'ログアウト中…' : 'ログアウト' }}</button>
      </template>
      <template v-else>
        <NuxtLink to="/admin/account/password" class="group relative flex min-h-11 items-center justify-center rounded-lg text-stone-400 hover:bg-white/10 hover:text-white" aria-label="パスワード変更" title="パスワード変更"><AdminIcon name="settings" /><span class="admin-nav-tooltip">パスワード変更</span></NuxtLink>
        <button type="button" :disabled="isLoggingOut" class="group relative flex min-h-11 w-full items-center justify-center rounded-lg text-stone-400 hover:bg-white/10 hover:text-white disabled:opacity-50" aria-label="ログアウト" title="ログアウト" @click="handleLogout"><AdminIcon name="logout" /><span class="admin-nav-tooltip">ログアウト</span></button>
      </template>
      <button v-if="!mobile" type="button" class="group relative mt-1 flex min-h-11 w-full items-center rounded-lg text-sm font-semibold text-stone-400 hover:bg-white/10 hover:text-white" :class="showLabels ? 'gap-3 px-3' : 'justify-center'" :aria-expanded="expanded" aria-label="サイドバーを開閉" :title="expanded ? 'サイドバーを閉じる' : 'サイドバーを開く'" @click="emit('toggle')">
        <AdminIcon :name="expanded ? 'collapse' : 'expand'" /><span v-if="showLabels">サイドバーを閉じる</span><span v-else class="admin-nav-tooltip">サイドバーを開く</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.admin-nav-tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 0.65rem);
  top: 50%;
  z-index: 60;
  width: max-content;
  max-width: 18rem;
  transform: translateY(-50%) translateX(-0.2rem);
  border-radius: 0.5rem;
  background: rgb(28 25 23 / 0.96);
  padding: 0.4rem 0.65rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1rem;
  opacity: 0;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);
  transition: opacity 150ms ease, transform 150ms ease;
}
.group:hover > .admin-nav-tooltip,
.group:focus-visible > .admin-nav-tooltip { transform: translateY(-50%) translateX(0); opacity: 1; }
.admin-navigation-scroll {
  scrollbar-color: rgb(87 83 78) transparent;
  scrollbar-width: thin;
}
.admin-navigation-scroll::-webkit-scrollbar { width: 5px; }
.admin-navigation-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(87 83 78);
}
@media (prefers-reduced-motion: reduce) { .admin-nav-tooltip { transition: none; } }
</style>
