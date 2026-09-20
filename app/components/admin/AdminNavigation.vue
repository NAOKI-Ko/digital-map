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
const { data: organizationData } = await useFetch('/api/organizations')
const { data: mapData } = await useFetch<AdminMapListResponse>('/api/maps')
const { data: assignedSpotData } = await useFetch<{ spots: Array<{ id: string }> }>('/api/spot-editor/spots')
const organizations = computed(() => organizationData.value?.organizations ?? [])
const maps = computed(() => mapData.value?.maps ?? [])
const activeOrganization = computed(() => organizations.value.find(item => item.id === organizationData.value?.activeOrganizationId))
const routeMapId = computed(() => typeof route.params.mapId === 'string' ? route.params.mapId : null)
const currentMap = computed(() => maps.value.find(map => map.id === routeMapId.value) ?? (maps.value.length === 1 ? maps.value[0]! : null))
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

function isActive(item: AdminNavigationItem) {
  return isAdminNavigationItemActive(item, route.path, route.hash)
}

onMounted(async () => {
  if (organizations.value.length && !activeOrganization.value) {
    await $fetch('/api/organizations/active', { method: 'POST', body: { tenantId: organizations.value[0]!.id } })
    await reloadNuxtApp({ path: '/admin/dashboard', force: true })
  }
})

async function handleLogout() {
  isLoggingOut.value = true
  try { await logout() }
  finally { isLoggingOut.value = false }
}

function handleNavigate() {
  emit('navigate')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-visible border-r border-stone-200 bg-stone-100 text-stone-800">
    <div class="flex min-h-[4.5rem] items-center border-b border-stone-200" :class="showLabels ? 'px-4' : 'justify-center px-2'">
      <NuxtLink :to="currentMap ? `/admin/maps/${currentMap.id}` : '/admin/dashboard'" class="group relative flex min-h-11 items-center rounded-lg" :class="showLabels ? 'gap-3' : 'justify-center px-3'" aria-label="Digital Map ホーム" @click="handleNavigate">
        <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-terracotta-600 text-sm font-black text-white">D</span>
        <span v-if="showLabels" class="min-w-0">
          <span class="block text-[0.65rem] font-semibold tracking-[0.2em] text-stone-600">DIGITAL MAP</span>
          <span class="mt-0.5 block truncate text-sm font-bold">ワークスペース</span>
        </span>
        <span v-else class="admin-nav-tooltip">ホーム</span>
      </NuxtLink>
    </div>

    <div class="relative border-b border-stone-200 p-2">
      <div v-if="showLabels" class="space-y-4 px-3 py-4">
        <div>
          <p class="text-[0.65rem] font-semibold tracking-wider text-stone-500">ワークスペース</p>
          <NuxtLink to="/admin/workspaces" class="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-stone-900 transition-colors hover:bg-stone-200/60 motion-reduce:transition-none" aria-label="ワークスペースを切り替える" @click="handleNavigate">
            <span class="min-w-0 flex-1 truncate">{{ activeOrganization?.name ?? 'ワークスペース未選択' }}</span>
            <AdminIcon name="chevron" class="shrink-0 text-stone-500" />
          </NuxtLink>
        </div>
        <div>
          <p class="text-[0.65rem] font-semibold tracking-wider text-stone-500">現在のマップ</p>
          <p class="mt-1 min-h-8 truncate px-2 py-1.5 text-sm font-semibold text-stone-700">{{ currentMap?.name ?? 'マップ未作成' }}</p>
        </div>
      </div>
      <NuxtLink v-else to="/admin/workspaces" class="group relative flex min-h-11 w-full items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-950 motion-reduce:transition-none" aria-label="ワークスペースを切り替える" title="ワークスペースを切り替える" @click="handleNavigate">
        <AdminIcon name="switch" />
        <span class="admin-nav-tooltip">ワークスペースを切り替える</span>
      </NuxtLink>
    </div>

    <nav class="admin-navigation-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="管理画面メニュー">
      <template v-if="showLabels">
        <section v-for="group in groupedNavigation" :key="group.id" class="mb-4">
          <h2 class="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone-500">{{ group.label }}</h2>
          <div class="space-y-0.5">
            <div v-for="item in group.items" :key="item.id">
              <div v-if="item.disabled" aria-disabled="true" class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-400">
                <AdminIcon :name="item.icon" class="shrink-0" /><span class="truncate">{{ item.label }}</span><span class="ml-auto rounded-full bg-stone-200 px-2 py-0.5 text-[0.65rem] text-stone-600">{{ item.status }}</span>
              </div>
              <NuxtLink v-else :to="item.to" class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors motion-reduce:transition-none" :class="isActive(item) ? 'bg-terracotta-50 text-terracotta-800 ring-1 ring-inset ring-terracotta-200' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-950'" :aria-current="isActive(item) ? 'page' : undefined" @click="handleNavigate">
                <AdminIcon :name="item.icon" class="shrink-0" /><span class="truncate">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </section>
      </template>
      <div v-else class="space-y-1">
        <NuxtLink v-for="item in railNavigation.filter(item => !item.disabled)" :key="item.id" :to="item.to" class="group relative flex min-h-11 items-center justify-center rounded-lg transition-colors motion-reduce:transition-none" :class="isActive(item) ? 'bg-terracotta-50 text-terracotta-800 ring-1 ring-inset ring-terracotta-200' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-950'" :aria-current="isActive(item) ? 'page' : undefined" :aria-label="item.shortLabel" :title="item.shortLabel" @click="handleNavigate">
          <AdminIcon :name="item.icon" /><span class="admin-nav-tooltip">{{ item.shortLabel }}</span>
        </NuxtLink>
      </div>
    </nav>

    <div class="border-t border-stone-200 p-2">
      <template v-if="showLabels">
        <details class="group/account"><summary class="cursor-pointer px-3 py-3 text-sm font-medium text-stone-600">アカウント</summary>
        <div class="px-3 py-2"><p class="truncate text-xs text-stone-500">ログイン中</p><p class="mt-1 truncate text-sm font-medium text-stone-700">{{ user?.displayName || user?.email }}</p></div>
        <NuxtLink to="/admin/account/password" class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-stone-950" @click="handleNavigate"><AdminIcon name="settings" /> パスワード変更</NuxtLink>
        <button type="button" :disabled="isLoggingOut" class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-stone-950 disabled:opacity-50" @click="handleLogout"><AdminIcon name="logout" /> {{ isLoggingOut ? 'ログアウト中…' : 'ログアウト' }}</button>
        </details>
      </template>
      <template v-else>
        <NuxtLink to="/admin/account/password" class="group relative flex min-h-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-950" aria-label="パスワード変更" title="パスワード変更"><AdminIcon name="settings" /><span class="admin-nav-tooltip">パスワード変更</span></NuxtLink>
        <button type="button" :disabled="isLoggingOut" class="group relative flex min-h-11 w-full items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-950 disabled:opacity-50" aria-label="ログアウト" title="ログアウト" @click="handleLogout"><AdminIcon name="logout" /><span class="admin-nav-tooltip">ログアウト</span></button>
      </template>
      <button v-if="!mobile" type="button" class="group relative mt-1 flex min-h-11 w-full items-center rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-stone-950" :class="showLabels ? 'gap-3 px-3' : 'justify-center'" :aria-expanded="expanded" aria-label="サイドバーを開閉" :title="expanded ? 'サイドバーを閉じる' : 'サイドバーを開く'" @click="emit('toggle')">
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
