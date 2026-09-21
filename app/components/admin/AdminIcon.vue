<script setup lang="ts">
import type { AdminIconName } from '~/utils/admin-navigation'

defineProps<{ name: AdminIconName | 'chevron' | 'collapse' | 'expand' | 'logout' | 'switch' }>()
</script>

<template>
  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    <template v-if="name === 'home'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.5 11.5 12 4l8.5 7.5" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M5.5 10v10h13V10M9.5 20v-6h5v6" />
    </template>
    <template v-else-if="name === 'maps'">
      <path stroke-linecap="round" stroke-linejoin="round" d="m3.5 6 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5V6Z" />
      <path stroke-linecap="round" d="M8.5 3.5v14M15.5 6v14" />
    </template>
    <template v-else-if="name === 'edit'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 5.5 18.5 10.5M4 20l3.4-.7L19.2 7.5a1.8 1.8 0 0 0 0-2.5l-.2-.2a1.8 1.8 0 0 0-2.5 0L4.7 16.6 4 20Z" />
    </template>
    <template v-else-if="name === 'spot'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.25" />
    </template>
    <template v-else-if="name === 'category'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5h6v6H4zM14 5.5h6v6h-6zM4 15.5h6v4H4zM14 15.5h6v4h-6z" />
    </template>
    <template v-else-if="name === 'publish'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15V3m0 0L8 7m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </template>
    <template v-else-if="name === 'paper'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 3.5h9l3 3V20.5H6zM15 3.5v4h3M9 12h6M9 15.5h6" />
    </template>
    <template v-else-if="name === 'analytics'">
      <path stroke-linecap="round" d="M5 20V11M12 20V4M19 20v-6" />
    </template>
    <template v-else-if="name === 'approval'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 3.5h10v17H7zM9.5 3.5V2h5v1.5M9.5 12l1.8 1.8 3.7-4" />
    </template>
    <template v-else-if="name === 'people' || name === 'editors'">
      <circle cx="9" cy="8" r="3" /><path stroke-linecap="round" d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 6.5a3 3 0 0 1 0 5.5M16 14c2.6.4 4 2.4 4.5 5" />
    </template>
    <template v-else-if="name === 'audit'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 3.5h14v17H5zM8 8h8M8 12h8M8 16h5" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A8 8 0 0 0 15 6l-.4-2.6h-4L10.2 6a8 8 0 0 0-1.5.9l-2.4-1-2 3.5L6.2 11A7 7 0 0 0 6 12c0 .4 0 .7.1 1l-2 1.6 2 3.4 2.5-1c.5.4 1 .7 1.5.9l.4 2.6h4l.4-2.6a8 8 0 0 0 1.5-.9l2.4 1 2-3.5-1.9-1.5c.1-.3.1-.7.1-1Z" />
    </template>
    <template v-else-if="name === 'assignment'">
      <circle cx="9" cy="8" r="3" /><path stroke-linecap="round" d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M16 8h5M18.5 5.5v5" />
    </template>
    <template v-else-if="name === 'switch'">
      <path stroke-linecap="round" stroke-linejoin="round" d="m7 7 3-3m-3 3 3 3M17 17l-3 3m3-3-3-3M8 4h7a3 3 0 0 1 3 3v2M16 20H9a3 3 0 0 1-3-3v-2" />
    </template>
    <template v-else-if="name === 'expand'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </template>
    <template v-else-if="name === 'collapse'">
      <path stroke-linecap="round" stroke-linejoin="round" d="m15 5-7 7 7 7" />
    </template>
    <template v-else-if="name === 'logout'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />
    </template>
    <template v-else>
      <path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7" />
    </template>
  </svg>
</template>
