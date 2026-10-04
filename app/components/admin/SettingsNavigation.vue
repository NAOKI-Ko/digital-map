<script setup lang="ts">
const props = defineProps<{ isOwner: boolean }>()
const route = useRoute()
const items = computed(() => [
  ...(props.isOwner ? [
    { label: 'Workspace', to: '/admin/organization#settings' },
    { label: 'Members', to: '/admin/organization#members' },
  ] : []),
  { label: 'Plan & Billing', to: '/admin/organization/billing' },
  { label: 'Account', to: '/admin/account/password' },
])
function isCurrent(to: string) {
  const [path, hash] = to.split('#')
  return route.path === path && (!hash || route.hash === `#${hash}` || (hash === 'settings' && !route.hash))
}
</script>

<template>
  <nav aria-label="Settings" class="mb-6 flex flex-wrap gap-1 border-b border-stone-200 pb-2">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" :aria-current="isCurrent(item.to) ? 'page' : undefined" class="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900" :class="isCurrent(item.to) ? 'bg-terracotta-50 text-terracotta-800' : 'text-stone-600 hover:bg-stone-100'">{{ item.label }}</NuxtLink>
  </nav>
</template>
