<script setup lang="ts">
import { buildMapEditSubnavigation, buildSpotSubnavigation } from '~/utils/admin-navigation'

const props = defineProps<{ mapId: string, area: 'map-edit' | 'spot' }>()
const route = useRoute()
const items = computed(() => props.area === 'map-edit'
  ? buildMapEditSubnavigation(props.mapId)
  : buildSpotSubnavigation(props.mapId))

function isCurrent(to: string) {
  if (to.endsWith('/spots')) return route.path === to || (route.path.startsWith(`${to}/`) && !route.path.endsWith('/import'))
  if (to.endsWith('/floors')) return route.path === to || route.path.startsWith(`${to}/`)
  return route.path === to
}
</script>

<template>
  <nav class="mb-6 overflow-x-auto border-b border-stone-200" :aria-label="area === 'map-edit' ? 'マップ編集メニュー' : 'スポット管理メニュー'">
    <div class="flex min-w-max gap-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="relative inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none"
        :class="isCurrent(item.to) ? 'text-terracotta-700' : 'text-stone-500 hover:text-stone-900'"
        :aria-current="isCurrent(item.to) ? 'page' : undefined"
      >
        {{ item.label }}
        <span v-if="isCurrent(item.to)" class="absolute inset-x-2 -bottom-px h-0.5 bg-terracotta-600" aria-hidden="true" />
      </NuxtLink>
    </div>
  </nav>
</template>

